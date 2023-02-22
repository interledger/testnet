import { makeGetRequest, makePostRequest } from '../utills/request'

const getAcceptableIDtypesByCountry = async (countryCode: string) => {
  return makeGetRequest(`identities/types?country=${countryCode}`)
}

const verifyIdentity = (profile: VerifyIdentityRequest) => {
  return makePostRequest('identities', JSON.stringify(profile))
}

export { getAcceptableIDtypesByCountry, verifyIdentity }
