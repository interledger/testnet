import axios from 'axios'
import crypto from 'crypto'
import env from '../../config/env'

const generateRandomString = (size: number) => {
  try {
    return crypto.randomBytes(size).toString('hex')
  } catch (error) {
    console.error('Error generating salt')
    throw error
  }
}

const getRandomArbitrary = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min)) + min
}

const getSaltKey = () => {
  const length = getRandomArbitrary(8, 16)
  return generateRandomString(length)
}

const getCurrentTimestamp = () => {
  return Math.round(new Date().getTime() / 1000) // Current Unix time (seconds).
}

const getIdempotency = () => {
  return new Date().getTime().toString()
}

const sign = (
  method: string,
  url: string,
  salt: string,
  timestamp: number,
  body: string
) => {
  const urlPath = `/v1/${url}`

  try {
    const bodyString = body == '{}' ? '' : body

    const toSign =
      method.toLowerCase() +
      urlPath +
      salt +
      timestamp +
      env.RAPYD_ACCESS_KEY +
      env.RAPYD_SECRET_KEY +
      bodyString
    console.log(`toSign: ${toSign}`)

    const hash = crypto.createHmac(
      'sha256',
      Buffer.from(env.RAPYD_SECRET_KEY ?? '')
    )
    hash.update(toSign)
    const signature = Buffer.from(hash.digest('hex')).toString('base64')
    console.log(`signature: ${signature}`)

    return signature
  } catch (error) {
    console.error('Error generating signature')
    throw error
  }
}

const getRapydRequestHeader = (url: string, body: string) => {
  const salt = getSaltKey()
  const timestamp = getCurrentTimestamp()
  const signature = sign('get', url, salt, timestamp, body)

  return {
    'Content-Type': 'application/json',
    'access_key': env.RAPYD_ACCESS_KEY,
    salt,
    'timestamp': getCurrentTimestamp(),
    signature,
    'idempotency': getIdempotency()
  }
}

const makeRapydGetRequest = (url: string) => {
  const headers = getRapydRequestHeader(url, '')

  console.log(headers)

  return axios.get(`${env.RAPYD_API}/${url}`, {
    headers
  })
}

const makeRapydPostRequest = (url: string, body: string) => {
  const headers = getRapydRequestHeader(url, body)

  return axios.post(`${env.RAPYD_API}/${url}`, JSON.parse(body), {
    headers
  })
}

export { makeRapydGetRequest, makeRapydPostRequest }
