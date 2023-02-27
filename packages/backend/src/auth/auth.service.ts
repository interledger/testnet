import express from 'express'
import { sign } from 'jsonwebtoken'
import env from '../config/env'
import { zParse } from '../middlewares/validator'
import { User } from '../user/models/user'
import logger from '../utils/logger'
import { RefreshToken } from './models/refreshToken'
import { loginSchema, signupSchema } from './schemas'
import { BadRequestException } from '../errors/BadRequestException'
import { UnauthorisedException } from './errors/UnauthorisedException'

const log = logger('AuthService')

const generateJWT = (
  userId: string
): { accessToken: string; expiresIn: number } => {
  return {
    accessToken: sign({ userId }, env.JWT_ACCESS_TOKEN_SECRET, {
      expiresIn: env.JWT_ACCESS_TOKEN_EXPIRATION_TIME
    }),
    expiresIn: Number(env.JWT_ACCESS_TOKEN_EXPIRATION_TIME)
  }
}

const appendTokensToCookie = (
  res: express.Response,
  accessToken: string,
  accessTokenExpiresIn: number,
  refreshToken: string,
  refreshTokenExpiresIn: number
) => {
  res.cookie('AccessToken', accessToken, {
    httpOnly: true,
    maxAge: accessTokenExpiresIn * 1000
  })

  res.cookie('RefreshToken', refreshToken, {
    httpOnly: true,
    maxAge: refreshTokenExpiresIn * 1000
  })
}

const generateRefreshToken = (
  userId: string
): { refreshToken: string; expiresIn: number } => {
  return {
    refreshToken: sign({ userId }, env.JWT_REFRESH_TOKEN_SECRET, {
      expiresIn: env.JWT_REFRESH_TOKEN_EXPIRATION_TIME
    }),
    expiresIn: Number(env.JWT_REFRESH_TOKEN_EXPIRATION_TIME)
  }
}

export const signup = async (req: express.Request, res: express.Response) => {
  try {
    const { email, password, confirmPassword } = await zParse(signupSchema, req)
    if (password !== confirmPassword) {
      throw new BadRequestException("Passwords don't match")
    }

    const existingUser = await User.query().where('email', email).first()

    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' })
    }
    await User.query().insert({ email, password })

    return res.status(201).json({ message: 'Success' })
  } catch (error) {
    log.error(error)
    return res.status(500).json({ error: 'Unable to create user' })
  }
}

export const login = async (req: express.Request, res: express.Response) => {
  const { email, password } = await zParse(loginSchema, req)

  const user = await User.query()
    .findOne({ email })
    .select('id', 'email', 'password')
    .throwIfNotFound(new UnauthorisedException('Invalid credentials'))
    .withGraphFetched('refreshTokens')

  const isValid = await user.verifyPassword(password)
  if (!isValid) {
    throw new UnauthorisedException('Invalid credentials')
  }

  let refreshToken = user.refreshTokens?.[0]

  const { refreshToken: generatedToken, expiresIn: refreshTokenExpiresIn } =
    generateRefreshToken(user.id)

  if (refreshToken) {
    refreshToken.token = generatedToken
    refreshToken.expiresAt = new Date(Date.now() + refreshTokenExpiresIn * 1000)

    await refreshToken.$query().patch(refreshToken)
  } else {
    refreshToken = new RefreshToken()
    refreshToken.token = generatedToken
    refreshToken.expiresAt = new Date(Date.now() + refreshTokenExpiresIn * 1000)

    await user.$relatedQuery('refreshTokens').insert(refreshToken)
  }

  const { accessToken, expiresIn: accessTokenExpiresIn } = generateJWT(user.id)

  appendTokensToCookie(
    res,
    accessToken,
    accessTokenExpiresIn,
    refreshToken.token,
    refreshTokenExpiresIn
  )

  return res.send({ user })
}

export const refresh = async (req: express.Request, res: express.Response) => {
  const refreshToken = req.cookies.RefreshToken
  if (!refreshToken) {
    return res.status(400).send({ message: 'No refresh token found' })
  }

  try {
    const existingRefreshToken = await RefreshToken.verify(refreshToken)
    const { userId } = existingRefreshToken
    if (!userId) {
      return res.status(400).send({ message: 'Invalid refresh token' })
    }

    const user = await User.query().findById(userId)

    if (!user) {
      return res.status(400).send({ message: 'User not found' })
    }

    const { accessToken: newAccessToken, expiresIn: accessTokenExpiresIn } =
      generateJWT(userId)
    const { refreshToken: newRefreshToken, expiresIn: refreshTokenExpiresIn } =
      generateRefreshToken(userId)

    existingRefreshToken.token = newRefreshToken
    existingRefreshToken.userId = user.id
    existingRefreshToken.expiresAt = new Date(
      Date.now() + refreshTokenExpiresIn * 1000
    )
    await existingRefreshToken.$query().patch(existingRefreshToken)

    appendTokensToCookie(
      res,
      newAccessToken,
      accessTokenExpiresIn,
      newRefreshToken,
      refreshTokenExpiresIn
    )

    res.status(200).send({ message: 'success' })
  } catch (error) {
    log.error(error)
    res.status(500).send({ message: 'Refresh failed' })
  }
}
