import express from 'express'
import { User } from '../user/models/user'
import { RefreshToken } from './models/refreshToken'

export const signup = async (req: express.Request, res: express.Response) => {
  try {
    const user = await User.query().insert(req.body)

    return res.status(201).json({ user })
  } catch (error) {
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

    const jwt = user.generateJWT()
    const generatedToken = user.generateRefreshToken()

    const refreshToken = new RefreshToken(user.id, generatedToken)

    await refreshToken.save()

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

  //* verify the signature of the refresh token.
  //* While verifying, we also check that the refresh token that the client provided exists in redis
  //* The refresh endpoint is the only one that actually
  //* communicates with a storage to verify the actuall refresh token,
  //* other endpoints just synchronously check the signature

  try {
    const userId = await RefreshToken.verify(refreshToken)

    if (!userId) {
      return res.status(400).send({ message: 'Invalid refresh token' })
    }

    //* If needed, the user id can be queried against the database here, in order to check the validity of the user
    //* In case of features such as 'invalidating users'
    /* 
      const user = await User.query().findById(userId!)
      if (!user) {
        throw new Error()
        return res.status(400).send({ message: 'User not found' })
       }
      */
    //* For the moment, an instance of the user is created using the id, without interacting with the DB at all
    const user = new User()
    user.id = userId

    // generate a new JWT
    // *also regenerates the current refresh token in redis and returns it to the client to replace the old one.
    // *this enables features such as 'infinite login'

    const newAccessToken = user.generateJWT()
    const newRefreshToken = user.generateRefreshToken()

    //* the regenerated token can be updated in redis
    //* by just calling save on a new RefreshToken class instance that holds the same id (userId)

    const updatedRefreshToken = new RefreshToken(userId, newRefreshToken)
    await updatedRefreshToken.save()

    // set the new Access and Refresh tokens as cookies
    res.cookie('AccessToken', newAccessToken, { httpOnly: true })
    res.cookie('RefreshToken', newRefreshToken, { httpOnly: true })

    res.status(200).send({ message: 'success' })
  } catch (error) {
    console.error(error)
    res.status(500).send({ message: 'Refresh failed' })
  }
}
