import { makeRapydGetRequest, makeRapydPostRequest } from '../utills/request'

const getAcceptableIdTypesByCountry = async (countryCode: string) => {
  return makeRapydGetRequest(`identities/types?country=${countryCode}`)
}

const verifyIdentity = (profile: VerifyIdentityRequest) => {
  return makeRapydPostRequest('identities', JSON.stringify(profile))
}

export { getAcceptableIdTypesByCountry, verifyIdentity }
