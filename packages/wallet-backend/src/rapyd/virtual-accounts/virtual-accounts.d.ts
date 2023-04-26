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

interface PayoutMethodTypesRequest {
  currency: string
}

interface PayoutMethodRequiredFieldsRequest {
  payout_method_type: string
  country: string
  currency: string
  payout_amount: number
}

interface WithdrawFundsFromWalletAccountRequest {
  beneficiary: { name: string; address: string }
  payout_amount: number
  payout_currency: string
  ewallet: string
  sender: { name: string; address: string }
  sender_country: string
  sender_currency: string
  beneficiary_entity_type: string
  sender_entity_type: string
  payout_method_type: string
}

interface CompletePayoutRequest {
  payout: string
  amount: number
}
