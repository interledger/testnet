import { sign } from 'jsonwebtoken'
import env from '../config/env'
import { zParse } from '../middlewares/validator'
import { User } from '../user/models/user'
import logger from '../utils/logger'
import { RefreshToken } from './models/refreshToken'
import { loginSchema, signupSchema } from './schemas'
import { BadRequestException } from '../shared/models/errors/BadRequestException'
import { UnauthorisedException } from './errors/UnauthorisedException'
import { NextFunction, Request, Response } from 'express'
import { BaseResponse } from '../shared/models/BaseResponse'

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
  res: Response,
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

export const signup = async (
  req: Request,
  res: Response<BaseResponse>,
  next: NextFunction
) => {
  try {
    const { email, password, confirmPassword } = await zParse(signupSchema, req)
    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match')
    }

    const existingUser = await User.query().where('email', email).first()

    if (existingUser) {
      return res
        .status(409)
        .json({ message: 'Email already exists', success: false })
    }
    await User.query().insert({ email, password })

    return res.status(201).json({ message: 'Success', success: true })
  } catch (error) {
    next(error)
  }
}

export const login = async (
  req: Request,
  res: Response<BaseResponse>,
  next: NextFunction
) => {
  try {
    const { email, password } = await zParse(loginSchema, req)

    const user = await User.query()
      .findOne({ email })
      .select('id', 'email', 'password')
      .withGraphFetched('refreshTokens')

    if (!user) {
      throw new UnauthorisedException('Invalid credentials')
    }

    const isValid = await user.verifyPassword(password)
    if (!isValid) {
      throw new UnauthorisedException('Invalid credentials')
    }

    let refreshToken = user.refreshTokens?.[0]

    const { refreshToken: generatedToken, expiresIn: refreshTokenExpiresIn } =
      generateRefreshToken(user.id)

    if (refreshToken) {
      refreshToken.token = generatedToken
      refreshToken.expiresAt = RefreshToken.expiresInToExpiresAt(
        refreshTokenExpiresIn
      )
      await refreshToken.$query().patch(refreshToken)
    } else {
      refreshToken = new RefreshToken(
        generatedToken,
        user.id,
        refreshTokenExpiresIn
      )
      await user.$relatedQuery('refreshTokens').insert(refreshToken)
    }

    const { accessToken, expiresIn: accessTokenExpiresIn } = generateJWT(
      user.id
    )

    appendTokensToCookie(
      res,
      accessToken,
      accessTokenExpiresIn,
      refreshToken.token,
      refreshTokenExpiresIn
    )

    return res.json({ success: true, message: 'Login successfull' })
  } catch (e) {
    next(e)
  }
}

export const refresh = async (req: Request, res: Response<BaseResponse>) => {
  try {
    const refreshToken = req.cookies.RefreshToken
    if (!refreshToken) {
      return res
        .status(400)
        .send({ message: 'No refresh token found', success: false })
    }
    const existingRefreshToken = await RefreshToken.verify(refreshToken)
    const { userId } = existingRefreshToken
    if (!userId) {
      return res
        .status(400)
        .send({ message: 'Invalid refresh token', success: false })
    }

    const user = await User.query().findById(userId)

    if (!user) {
      return res.status(400).send({ message: 'User not found', success: false })
    }

    const { accessToken: newAccessToken, expiresIn: accessTokenExpiresIn } =
      generateJWT(userId)
    const { refreshToken: newRefreshToken, expiresIn: refreshTokenExpiresIn } =
      generateRefreshToken(userId)

    existingRefreshToken.token = newRefreshToken
    existingRefreshToken.userId = user.id
    existingRefreshToken.expiresAt = RefreshToken.expiresInToExpiresAt(
      refreshTokenExpiresIn
    )

    await existingRefreshToken.$query().patch(existingRefreshToken)

    appendTokensToCookie(
      res,
      newAccessToken,
      accessTokenExpiresIn,
      newRefreshToken,
      refreshTokenExpiresIn
    )

    res.status(200).send({ message: 'success', success: true })
  } catch (error) {
    log.error(error)
    res.status(500).send({ message: 'Refresh failed', success: false })
  }
}
