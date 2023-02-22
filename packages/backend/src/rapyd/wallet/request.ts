import { makePostRequest } from '../utills/request'

const createRapydWallet = async (wallet: RapydWallet) => {
  return makePostRequest('user', JSON.stringify(wallet))
}

export { createRapydWallet }
