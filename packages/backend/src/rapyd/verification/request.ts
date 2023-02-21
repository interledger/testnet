import axios from 'axios'

const getAcceptableIDtypesByCountry = async (countryCode: string) => {
  return await axios.get(
    `${process.env.RAPYD_API}/identities/types?country=${countryCode}`
  )
}

const verifyIdentity = (profile: VerifyIdentityRequest) => {
  return axios.post(`${process.env.RAPYD_API}/identities`, profile)
}

export { getAcceptableIDtypesByCountry, verifyIdentity }
