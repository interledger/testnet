import express from 'express'
import { Secret, sign } from 'jsonwebtoken'
import { User } from '../user/models/user'
import { RefreshToken } from './models/refreshToken'

const generateJWT = (userId: string) => {
  return sign({ userId }, process.env.JWT_ACCESS_TOKEN_SECRET as Secret, {
    expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRATION_TIME
  })
}

const generateRefreshToken = (userId: string) => {
  return sign({ userId }, process.env.JWT_REFRESH_TOKEN_SECRET as Secret, {
    expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRATION_TIME
  })
}

export const signup = async (req: express.Request, res: express.Response) => {
  console.log('reached signup')
  try {
    console.log(req.body)
    const user = await User.query().insert(req.body)

    return res.status(201).json({ user })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ error: 'Unable to create user' })
  }
}

export const login = async (req: express.Request, res: express.Response) => {
  try {
    const { email, password } = req.body

    const user = await User.query()
      .findOne({ email })
      .select('id', 'email', 'password')
      .throwIfNotFound()

    const isValid = await user.verifyPassword(password)
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const jwt = generateJWT(user.id)
    const generatedToken = generateRefreshToken(user.id)

    const refreshToken = new RefreshToken()
    //TODO: Save refresh token to db, linked to users.
    refreshToken.token = generatedToken

    await user.$relatedQuery('refreshTokens').insert(refreshToken)

    res.cookie('AccessToken', jwt, { httpOnly: true })
    res.cookie('RefreshToken', refreshToken, { httpOnly: true })

    return res.json({ user })
  } catch (error) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }
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

    const newAccessToken = generateJWT(userId)
    const newRefreshToken = generateRefreshToken(userId)

    existingRefreshToken.token = newRefreshToken
    existingRefreshToken.userId = user.id
    await existingRefreshToken.$query().patch()

    res.cookie('AccessToken', newAccessToken, { httpOnly: true })
    res.cookie('RefreshToken', newRefreshToken, { httpOnly: true })

    res.status(200).send({ message: 'success' })
  } catch (error) {
    console.error(error)
    res.status(500).send({ message: 'Refresh failed' })
  }
}
