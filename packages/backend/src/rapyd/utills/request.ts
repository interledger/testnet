import axios from 'axios'

const getSaltKey = () => {
  return '123'
}

const getTimeStamp = () => {
  return 323123213
}

const getSignature = () => {
  return '222222'
}

const makeRapydGetRequest = (url: string) => {
  return axios.get(`${process.env.RAPYD_API}/${url}`, {
    headers: {
      'Content-Type': 'application/json',
      'access_key': process.env.RAPYD_ACCESS_KEY,
      'salt': getSaltKey(),
      'timestamp': getTimeStamp(),
      'signature': getSignature()
    }
  })
}

const makeRapydPostRequest = (url: string, body: string) => {
  return axios.post(`${process.env.RAPYD_API}/${url}`, JSON.parse(body), {
    headers: {
      'Content-Type': 'application/json',
      'access_key': process.env.RAPYD_ACCESS_KEY,
      'salt': getSaltKey(),
      'timestamp': getTimeStamp(),
      'signature': getSignature()
    }
  })
}

export { makeRapydGetRequest, makeRapydPostRequest }
