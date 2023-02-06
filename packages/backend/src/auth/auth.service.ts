import jwt from 'jsonwebtoken'
import { addUser, getUserByUsername } from '../user/user.service'

import * as bcrypt from 'bcryptjs'

const JWT_SECRET = 'secret-key'

export async function login(
  username: string,
  password: string
): Promise<string> {
  try {
    const user = await getUserByUsername(username)
    if (!user || user.password !== password) {
      throw new Error('Username or password is incorrect')
    }
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' })
    return token
  } catch (error) {
    throw new Error('Error while logging in')
  }
}

export async function signup({
  username,
  password,
  email
}: {
  username: string
  password: string
  email: string
}): Promise<{
  username: string
  password: string
  email: string
}> {
  try {
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)
    return addUser({ username, password: hashedPassword, email })
  } catch (error) {
    throw new Error('Error while signing up')
  }
}
