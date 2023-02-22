import { makeRapydGetRequest, makeRapydPostRequest } from '../utills/request'

const getAcceptableIDtypesByCountry = async (countryCode: string) => {
  return makeRapydGetRequest(`identities/types?country=${countryCode}`)
}

const verifyIdentity = (profile: VerifyIdentityRequest) => {
  return makeRapydPostRequest('identities', JSON.stringify(profile))
}

export { getAcceptableIDtypesByCountry, verifyIdentity }
