import axios from 'axios'
import crypto from 'crypto'

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
      process.env.RAPYD_ACCESS_KEY +
      process.env.RAPYD_SECRET_KEY +
      bodyString
    console.log(`toSign: ${toSign}`)

    const hash = crypto.createHmac(
      'sha256',
      Buffer.from(process.env.RAPYD_SECRET_KEY ?? '')
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

const makeRapydGetRequest = (url: string) => {
  const salt = getSaltKey()
  const timestamp = getCurrentTimestamp()
  const signature = sign('get', url, salt, timestamp, '')

  return axios.get(`${process.env.RAPYD_API}/${url}`, {
    headers: {
      'Content-Type': 'application/json',
      'access_key': process.env.RAPYD_ACCESS_KEY,
      salt,
      'timestamp': getCurrentTimestamp(),
      signature,
      'idempotency': getIdempotency()
    }
  })
}

const makeRapydPostRequest = (url: string, body: string) => {
  const salt = getSaltKey()
  const timestamp = getCurrentTimestamp()
  const signature = sign('get', url, salt, timestamp, body)

  return axios.post(`${process.env.RAPYD_API}/${url}`, JSON.parse(body), {
    headers: {
      'Content-Type': 'application/json',
      'access_key': process.env.RAPYD_ACCESS_KEY,
      salt,
      'timestamp': getCurrentTimestamp(),
      signature,
      'idempotency': getIdempotency()
    }
  })
}

export { makeRapydGetRequest, makeRapydPostRequest }
