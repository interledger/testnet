import { makeRapydPostRequest } from '../utills/request'

const createRapydWallet = async (wallet: RapydWallet) => {
  return await makeRapydPostRequest('user', JSON.stringify(wallet))
}

export { createRapydWallet }
