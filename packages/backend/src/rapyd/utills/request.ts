import axios from 'axios'
import env from '../../config/env'
import crypto from 'crypto-js'

const calcSignature = (
  httpMethod: string,
  url: string,
  salt: string,
  accessKey: string,
  secretKey: string,
  body: string
): string => {
  const timestamp: string = (
    Math.floor(new Date().getTime() / 1000) - 10
  ).toString()
  const toSign: string =
    httpMethod + url + salt + timestamp + accessKey + secretKey + body
  const signature = crypto.enc.Hex.stringify(
    crypto.HmacSHA256(toSign, secretKey)
  )
  return crypto.enc.Base64.stringify(crypto.enc.Utf8.parse(signature))
}

const getRapydRequestHeader = (url: string, body: string) => {
  const salt = crypto.lib.WordArray.random(12).toString()
  const timestamp = (Math.floor(new Date().getTime() / 1000) - 10).toString()

  const signature = calcSignature(
    'post',
    `/v1/${url}`,
    salt,
    env.RAPYD_ACCESS_KEY,
    env.RAPYD_SECRET_KEY,
    body
  )

  return {
    'Content-Type': 'application/json',
    'access_key': env.RAPYD_ACCESS_KEY,
    salt,
    timestamp,
    signature
  }
}

const makeRapydGetRequest = async (url: string) => {
  const headers = getRapydRequestHeader(url, '')

  const res = await axios.get(`${env.RAPYD_API}/${url}`, {
    headers
  })

  return res.data
}

const makeRapydPostRequest = async (url: string, body: string) => {
  const headers = getRapydRequestHeader(url, body)

  const res = await axios.post(`${env.RAPYD_API}/${url}`, JSON.parse(body), {
    headers
  })

  return res.data
}

export { makeRapydGetRequest, makeRapydPostRequest }
