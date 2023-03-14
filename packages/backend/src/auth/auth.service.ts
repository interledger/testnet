import { NextFunction, Request, Response } from 'express'
import { sign } from 'jsonwebtoken'
import env from '../config/env'
import { zParse } from '../middlewares/validator'
import { BaseResponse } from '../shared/models/BaseResponse'
import { BadRequestException } from '../shared/models/errors/BadRequestException'
import { NotFoundException } from '../shared/models/errors/NotFoundException'
import { User } from '../user/models/user'
import { UnauthorisedException } from './errors/UnauthorisedException'
import { RefreshToken } from './models/refreshToken'
import { loginSchema, signupSchema } from './schemas'

export interface AccessTokenPayload {
  userId: string
  email: string
  noKyc?: boolean
  expiresIn: number
}

export const generateJWT = (
  user: User
): { accessToken: string; expiresIn: number } => {
  const payload = {
    userId: user.id,
    email: user.email,
    noKyc: !user.rapydEWalletId
  }
  return {
    accessToken: sign(payload, env.JWT_ACCESS_TOKEN_SECRET, {
      expiresIn: env.JWT_ACCESS_TOKEN_EXPIRATION_TIME
    }),
    expiresIn: Number(env.JWT_ACCESS_TOKEN_EXPIRATION_TIME)
  }
}

export const appendAccessTokenToCookie = (
  res: Response,
  token: string,
  expiresIn: number
) => {
  res.cookie('AccessToken', token, {
    httpOnly: true,
    maxAge: expiresIn * 1000
  })
}

const appendRefreshTokenToCookie = (
  res: Response,
  token: string,
  expiresIn: number
) => {
  res.cookie('RefreshToken', token, {
    httpOnly: true,
    maxAge: expiresIn * 1000
  })
}

const appendTokensToCookie = (
  res: Response,
  accessToken: string,
  accessTokenExpiresIn: number,
  refreshToken: string,
  refreshTokenExpiresIn: number
) => {
  appendAccessTokenToCookie(res, accessToken, accessTokenExpiresIn)
  appendRefreshTokenToCookie(res, refreshToken, refreshTokenExpiresIn)
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
      await refreshToken.$query().patch({ ...refreshToken })
    } else {
      refreshToken = new RefreshToken(
        generatedToken,
        user.id,
        refreshTokenExpiresIn
      )
      await user.$relatedQuery('refreshTokens').insert({ ...refreshToken })
    }

    const { accessToken, expiresIn: accessTokenExpiresIn } = generateJWT(user)

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

export const refresh = async (
  req: Request,
  res: Response<BaseResponse>,
  next: NextFunction
) => {
  try {
    const refreshToken = req.cookies.RefreshToken
    if (!refreshToken) {
      throw new UnauthorisedException('No refresh token provided')
    }
    const existingRefreshToken = await RefreshToken.verify(refreshToken)
    const { userId } = existingRefreshToken
    if (!userId) {
      throw new UnauthorisedException('Invalid refresh token')
    }

    const user = await User.query().findById(userId)

    if (!user) {
      throw new UnauthorisedException('Invalid refresh token')
    }

    const { accessToken: newAccessToken, expiresIn: accessTokenExpiresIn } =
      generateJWT(user)
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
  } catch (e) {
    next(e)
  }
}

export interface UserProfile {
  email: string
  firstName?: string
  lastName?: string
  noKyc: boolean
}
export const me = async (
  req: Request,
  res: Response<BaseResponse<UserProfile>>,
  next: NextFunction
) => {
  try {
    const refreshToken = req.cookies.RefreshToken
    if (!refreshToken) {
      throw new BadRequestException('No refresh token provided')
    }

    const existingRefreshToken = await RefreshToken.verify(refreshToken)
    const { userId } = existingRefreshToken
    if (!userId) {
      throw new BadRequestException('Invalid refresh token')
    }

    const user = await User.query().findById(userId)
    if (!user) {
      throw new NotFoundException()
    }

    return res.status(200).send({
      message: 'success',
      success: true,
      data: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        noKyc: !user.rapydContactId
      }
    })
  } catch (e) {
    next(e)
  }
}
