import { makeRapydGetRequest, makeRapydPostRequest } from '../utills/request'

// TODO: Abstract interface for different Rapyd responses
interface RapydGetAccoutBalanceResponse {
  status: {
    error_code: string
    status: string
    message: string
    response_code: string
  }
  data: {
    id: string
    currency: string
    alias: string
    balance: number
    received_balance: number
    on_hold_balance: number
    reserve_balance: number
    limits: null
    limit: null
  }[]
}

const createRapydWallet = async (wallet: RapydWallet) => {
  return await makeRapydPostRequest('user', JSON.stringify(wallet))
}

const rapydVerifyIdentity = async (req: RapydIdentityRequest) => {
  return await makeRapydPostRequest('identities', JSON.stringify(req))
}

const rapydWithdrawLiquidity = async (req: RapydWithdrawRequest) => {
  return await makeRapydPostRequest('account/withdraw', JSON.stringify(req))
}

const rapydDepositLiquidity = async (req: RapydDepositRequest) => {
  return await makeRapydPostRequest('account/withdraw', JSON.stringify(req))
}

const getAccountsBalance = async (
  walletId: string
): Promise<RapydGetAccoutBalanceResponse> => {
  return makeRapydGetRequest(`user/${walletId}/accounts`)
}

export {
  createRapydWallet,
  rapydVerifyIdentity,
  rapydWithdrawLiquidity,
  rapydDepositLiquidity,
  getAccountsBalance
}
