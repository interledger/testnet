import { makeRapydPostRequest } from '../utills/request'

const createRapydWallet = (wallet: RapydWallet) => {
  return makeRapydPostRequest('user', JSON.stringify(wallet))
}

export { createRapydWallet }
