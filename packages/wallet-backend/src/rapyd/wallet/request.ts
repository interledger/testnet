import env from '../../config/env'
import {
  makeRapydGetRequest,
  makeRapydPostRequest,
  makeRapydPutRequest
} from '../utills/request'

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

const updateRapydProfile = async (profile: RapydProfile) => {
  return await makeRapydPutRequest('user', JSON.stringify(profile))
}

const rapydVerifyIdentity = async (req: RapydIdentityRequest) => {
  return await makeRapydPostRequest('identities', JSON.stringify(req))
}

const rapydDepositLiquidity = async (req: RapydDepositRequest) => {
  return await makeRapydPostRequest('account/deposit', JSON.stringify(req))
}

const rapydHoldLiquidity = async (req: RapydHoldRequest) => {
  return await makeRapydPostRequest('account/balance/hold', JSON.stringify(req))
}

const rapydReleaseLiquidity = async (req: RapydReleaseRequest) => {
  return await makeRapydPostRequest(
    'account/balance/release',
    JSON.stringify(req)
  )
}

const rapydTransferLiquidity = async (
  req: RapydTransferRequest,
  withAccept?: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> => {
  if (!withAccept) {
    return await makeRapydPostRequest('account/transfer', JSON.stringify(req))
  }
  const transferResponse = await makeRapydPostRequest(
    'account/transfer',
    JSON.stringify(req)
  )
  if (transferResponse.status.status !== 'SUCCESS') {
    if (
      transferResponse.status.error_code === 'NOT_ENOUGH_FUNDS' &&
      req.source_ewallet === env.RAPYD_SETTLEMENT_EWALLET
    ) {
      // await handleSettlementOutOfFunds(req, env.RAPYD_SETTLEMENT_EWALLET)
    }
    throw new Error(transferResponse.status.message)
  }

  const setTransferResponse = await rapydSetTransferResponse({
    id: transferResponse.data.id,
    status: 'accept'
  })

  if (setTransferResponse.status.status !== 'SUCCESS') {
    throw new Error(`Unable to set accepted response of wallet transfer`)
  }

  return setTransferResponse
}

/*
const handleSettlementOutOfFunds = async (
  req: RapydTransferRequest,
  settlementWallet: string
) => {
  const depositResult = await rapydDepositLiquidity({
    amount: 100000,
    currency: req.currency,
    ewallet: settlementWallet
  })

  if (depositResult.status.status !== 'SUCCESS') {
    throw new Error(
      `Unable to automatically refund settlement account upon insufecient funds encountered`
    )
  }
  return await rapydTransferLiquidity(req, true)
}
*/

const rapydSetTransferResponse = async (
  req: RapydSetTransferResponseRequest
) => {
  return await makeRapydPostRequest(
    'account/transfer/response',
    JSON.stringify(req)
  )
}

const getAccountsBalance = async (
  walletId: string
): Promise<RapydGetAccoutBalanceResponse> => {
  return makeRapydGetRequest(`user/${walletId}/accounts`)
}

export {
  createRapydWallet,
  rapydVerifyIdentity,
  rapydDepositLiquidity,
  rapydHoldLiquidity,
  rapydReleaseLiquidity,
  rapydTransferLiquidity,
  rapydSetTransferResponse,
  updateRapydProfile,
  getAccountsBalance
}
