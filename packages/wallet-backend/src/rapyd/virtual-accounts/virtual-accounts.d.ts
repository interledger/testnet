interface VirtualAccountRequest {
  country: string
  currency: string
  description?: string
  ewallet: string
  merchant_reference_id?: string
  metadata?: string
}

interface SimulateBankTransferToWalletRequest {
  amount: number
  currency: string
  issued_bank_account: string
  remitter_information?: string
}

interface WithdrawFundsFromWalletAccountRequest {
  account: string
  sum: number
}
