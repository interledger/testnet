import { makeRapydPostRequest } from '../utills/request'

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

const withdrawFundsFromWalletAccount = (
  withdrawFundsFromWalletAccountRequest: WithdrawFundsFromWalletAccountRequest
) => {
  const { account, sum } = withdrawFundsFromWalletAccountRequest
  return makeRapydPostRequest(`pos/withdraw/${account}/${sum}`, '')
}

export {
  issueVirtualAccount,
  simulateBankTransferToWallet,
  withdrawFundsFromWalletAccount
}
