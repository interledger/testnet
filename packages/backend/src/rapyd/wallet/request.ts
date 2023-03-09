import { makeRapydPostRequest } from '../utills/request'

const createRapydWallet = async (wallet: RapydWallet) => {
  return await makeRapydPostRequest('user', JSON.stringify(wallet))
}

const rapydVerifyIdentity = async (req: RapydIdentityRequest) => {
  return await makeRapydPostRequest('identities', JSON.stringify(req))
}

export { createRapydWallet, rapydVerifyIdentity }
