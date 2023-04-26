import { makeRapydGetRequest, makeRapydPostRequest } from '../utills/request'

const issueVirtualAccount = (virtualAccountRequest: VirtualAccountRequest) => {
  return makeRapydPostRequest(
    'issuing/bankaccounts',
    JSON.stringify(virtualAccountRequest)
  )
}

const simulateBankTransferToWallet = (
  simulateBankTransferToWalletRequest: SimulateBankTransferToWalletRequest
) => {
  return makeRapydPostRequest(
    'issuing/bankaccounts/bankaccounttransfertobankaccount',
    JSON.stringify(simulateBankTransferToWalletRequest)
  )
}

const getPayoutMethodTypes = (
  payoutMethodTypesRequest: PayoutMethodTypesRequest
) => {
  return makeRapydGetRequest(
    `payouts/supported_types?payout_currency=${payoutMethodTypesRequest.currency}&limit=1`
  )
}

const getPayoutTypeRequiredFields = (
  payoutTypeRequiredFieldsRequest: PayoutMethodRequiredFieldsRequest
) => {
  const { payout_method_type, country, currency, payout_amount } =
    payoutTypeRequiredFieldsRequest
  return makeRapydGetRequest(
    `payout_methods/${payout_method_type}/required_fields?sender_country=${country}&sender_currency=${currency}&beneficiary_country=${country}&payout_currency=${currency}&sender_entity_type=individual&beneficiary_entity_type=individual&payout_amount=${payout_amount}`
  )
}

const withdrawFundsFromWalletAccount = (
  withdrawFundsFromWalletAccountRequest: WithdrawFundsFromWalletAccountRequest
) => {
  return makeRapydPostRequest(
    'payouts',
    JSON.stringify(withdrawFundsFromWalletAccountRequest)
  )
}

const completePayout = (completePayoutRequest: CompletePayoutRequest) => {
  const { payout, amount } = completePayoutRequest
  return makeRapydPostRequest(
    `payouts/complete/${payout}/${amount}`,
    JSON.stringify(completePayoutRequest)
  )
}

export {
  issueVirtualAccount,
  simulateBankTransferToWallet,
  getPayoutMethodTypes,
  getPayoutTypeRequiredFields,
  withdrawFundsFromWalletAccount,
  completePayout
}
