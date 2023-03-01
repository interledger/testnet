import { makeRapydPostRequest } from '../utills/request'

const createRapydWallet = async (wallet: RapydWallet) => {
  return makeRapydPostRequest('user', JSON.stringify(wallet))
}

export { createRapydWallet }
