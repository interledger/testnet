import z from 'zod'
export interface RapydResponse<T> {
  status: z.TypeOf<typeof StatusSchema>
  data: T
}

export const StatusSchema = z.object({
  error_code: z.string(),
  status: z.string(),
  message: z.string(),
  response_code: z.string(),
  operation_id: z.string()
})

export type Status = z.TypeOf<typeof StatusSchema>

export const RapydAddressSchema = z.object({
  id: z.string().optional(),
  address: z.string().optional(),
  canton: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  created_at: z.number().optional(),
  district: z.string().optional(),
  line_1: z.string().optional(),
  line_2: z.string().optional(),
  line_3: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  name: z.string().optional(),
  phone_number: z.string().optional(),
  state: z.string().optional(),
  updated_at: z.number().optional(),
  zip: z.string().optional()
})

export type RapydAddresss = z.TypeOf<typeof RapydAddressSchema>

export const RapydBusinessDetailSchema = z.object({
  id: z.string().optional(),
  address: RapydAddressSchema.optional(),
  annual_revenue: z.number().optional(),
  cnae_code: z.string().optional(),
  created_at: z.number().optional(),
  entity_type: z
    .enum([
      'sole_prop',
      'partnership',
      'company',
      'government',
      'charity',
      'NPO',
      'association',
      'trust'
    ])
    .optional(),
  establishment_date: z.string().optional(),
  industry_category: z.string().optional(),
  industry_sub_category: z.string().optional(),
  legal_entity_type: z.string().optional(),
  name: z.string().optional(),
  registration_number: z.string().optional()
})

export type RapydBussinessDetail = z.TypeOf<typeof RapydBusinessDetailSchema>

export const RapydIssueCardDataSchema = z.object({
  preferred_name: z.string().optional(),
  transaction_permissions: z.enum(['allowed', 'not_allowed']).optional(),
  role_in_company: z.enum(['owner', 'agent', 'employee']).optional()
})

export type RapydIssueCardData = z.TypeOf<typeof RapydIssueCardDataSchema>

export const RapydWalletContactSchema = z.object({
  id: z.string().optional(),
  address: z.union([RapydAddressSchema, z.string()]).optional(),
  business_details: RapydBusinessDetailSchema.optional(),
  compliance_profile: z
    .union([z.literal(1), z.literal(0), z.literal(-1)])
    .optional(),
  contact_type: z.enum(['personal', 'business']).optional(),
  country: z.string().optional(),
  created_at: z.number().optional(),
  date_of_birth: z.string().optional(),
  email: z.string().optional(),
  ewallet: z.string().optional(),
  first_name: z.string().optional(),
  gender: z.enum(['male', 'female', 'other', 'not_applicable']).optional(),
  house_type: z
    .enum([
      'lease',
      'live_with_family',
      'own',
      'owner',
      'month_to_month',
      'housing_project'
    ])
    .optional(),
  identification_number: z.string().optional(),
  identification_type: z.string().optional(),
  issued_card_data: RapydIssueCardDataSchema.optional(),
  last_name: z.string().optional(),
  marital_status: z
    .enum([
      'married',
      'single',
      'divorced',
      'widowed',
      'cohabiting',
      'not_applicable'
    ])
    .optional(),
  metadata: z.record(z.unknown()).optional(),
  middle_name: z.string().optional(),
  mothers_name: z.string().optional(),
  nationality: z.string().optional(),
  phone_number: z.string().optional(),
  second_last_name: z.string().optional(),
  send_notifications: z.boolean().optional(),
  verification_status: z.enum(['not verified', 'KYCd']).optional()
})

export type RapydWalletContact = z.TypeOf<typeof RapydWalletContactSchema>

export const RapydWalletContactsSchema = z.object({
  data: z.array(RapydWalletContactSchema).optional(),
  has_more: z.boolean().optional(),
  total_count: z.number().optional(),
  url: z.string().optional()
})

export type RapydWalletContacts = z.TypeOf<typeof RapydWalletContactsSchema>

export const RapydAccountSchema = z.object({
  id: z.string().optional(),
  alias: z.string().optional(),
  balance: z.number().optional(),
  currency: z.string().optional(),
  limit: z.number().optional(),
  limits: z.number().optional(),
  on_hold_balance: z.number().optional(),
  received_balance: z.number().optional(),
  reserve_balance: z.number().optional()
})

export type RapydAccount = z.TypeOf<typeof RapydAccountSchema>

export const RapydWalletSchema = z.object({
  id: z.string().optional(),
  accounts: z.array(RapydAccountSchema).optional(),
  category: z
    .enum(['collect', 'disburse', 'card_authorization', 'general'])
    .optional(),
  contact: RapydWalletContactSchema.optional(),
  contacts: RapydWalletContactsSchema.optional(),
  email: z.string().optional(),
  ewallet_reference_id: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  phone_number: z.string().optional(),
  status: z.enum(['ACT', 'DIS']).optional(),
  type: z.enum(['company', 'person', 'client']).optional(),
  verification_status: z.enum(['not verified', 'KYCd']).optional()
})

export type RapydWallet = z.TypeOf<typeof RapydWalletSchema>

export const RapydProfileSchema = z.object({
  ewallet: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional()
})

export type RapydProfile = z.TypeOf<typeof RapydProfileSchema>

export const VirtualAccountRequestSchema = z.object({
  country: z.string(),
  currency: z.string(),
  description: z.string().optional(),
  ewallet: z.string(),
  merchant_reference_id: z.string().optional(),
  metadata: z.string().optional()
})

export type VirtualAccountRequest = z.TypeOf<typeof VirtualAccountRequestSchema>

export const BankAccountSchema = z.object({
  beneficiary_name: z.string(),
  address: z.string(),
  country_iso: z.string(),
  iban: z.string(),
  bic: z.string()
})

export type BankAccount = z.TypeOf<typeof BankAccountSchema>

export const TransactionSchema = z.object({
  id: z.string(),
  amount: z.number(),
  currency: z.string(),
  created_at: z.number()
})

export type Transaction = z.TypeOf<typeof TransactionSchema>

export const VirtualAccountResponseSchema = z.object({
  id: z.string(),
  merchant_reference_id: z.string(),
  ewallet: z.string(),
  bank_account: BankAccountSchema,
  metadata: z
    .object({
      merchant_defined: z.boolean()
    })
    .optional(),
  status: z.enum(['ACT', 'DIS']),
  description: z.string().optional(),
  funding_instructions: z.union([z.unknown(), z.null()]),
  currency: z.string(),
  transactions: z.array(TransactionSchema)
})

export type VirtualAccountResponse = z.TypeOf<
  typeof VirtualAccountResponseSchema
>

export const SimulateBankTransferToWalletRequestSchema = z.object({
  amount: z.number(),
  currency: z.string(),
  issued_bank_account: z.string(),
  remitter_information: z.string().optional()
})

export type SimulateBankTransferToWalletRequest = z.TypeOf<
  typeof SimulateBankTransferToWalletRequestSchema
>

export const SimulateBankTransferToWalletResponseSchema =
  SimulateBankTransferToWalletRequestSchema

export type SimulateBankTransferToWalletResponse =
  SimulateBankTransferToWalletRequest

export const RapydDocumentTypeSchema = z.object({
  country: z.string().optional(),
  type: z.string().optional(),
  name: z.string().optional(),
  is_back_required: z.boolean().optional(),
  is_address_extractable: z.boolean().optional()
})

export type RapydDocumentType = z.TypeOf<typeof RapydDocumentTypeSchema>

export const RapydDocumentsTypeSchema = z.array(RapydDocumentTypeSchema)

export type RapydDocumentsTypeSchema = z.TypeOf<typeof RapydDocumentsTypeSchema>

export const RapydCountrySchema = z.object({
  id: z.number().optional(),
  name: z.string().optional(),
  iso_alpha2: z.string().optional(),
  iso_alpha3: z.string().optional(),
  currency_code: z.string().optional(),
  currency_name: z.string().optional(),
  currency_sign: z.string().optional(),
  phone_code: z.string().optional()
})

export type RapydCountry = z.TypeOf<typeof RapydCountrySchema>

export const RapydIdentityResponseSchema = z.object({
  id: z.string(),
  reference_id: z.string()
})

export type RapydIdentityResponse = z.TypeOf<typeof RapydIdentityResponseSchema>

export const RapydIdentityRequestSchema = z.object({
  reference_id: z.string().optional(),
  ewallet: z.string().optional(),
  country: z.string().optional(),
  document_type: z.string().optional(),
  front_side_image: z.string().optional(),
  front_side_image_mime_type: z.string().optional(),
  face_image: z.string().optional(),
  face_image_mime_type: z.string().optional(),
  back_side_image: z.string().optional(),
  back_side_image_mime_type: z.string().optional()
})

export type RapydIdentityRequest = z.TypeOf<typeof RapydIdentityRequestSchema>

export const RapydWithdrawRequestSchema = z.object({
  ewallet: z.string(),
  amount: z.number(),
  currency: z.string()
})

export type RapydWithdrawRequest = z.TypeOf<typeof RapydWithdrawRequestSchema>

export const RapydTransferRequestSchema = z.object({
  source_ewallet: z.string(),
  amount: z.number(),
  currency: z.string(),
  destination_ewallet: z.string()
})

export type RapydTransferRequest = z.TypeOf<typeof RapydTransferRequestSchema>

export const RapydSetTransferResponseSchema = z.object({
  id: z.string(),
  status: z.string(),
  amount: z.number(),
  currency_code: z.string(),
  destination_phone_number: z.string().nullable(),
  destination_ewallet_id: z.string(),
  destination_transaction_id: z.string(),
  source_ewallet_id: z.string(),
  source_transaction_id: z.string(),
  transfer_response_at: z.number(),
  created_at: z.number(),
  metadata: z
    .object({
      merchant_defined: z.boolean().optional()
    })
    .optional(),
  response_metadata: z
    .object({
      merchant_defined: z.string().optional()
    })
    .optional(),
  expiration: z.number()
})

export type RapydSetTransferResponse = z.TypeOf<
  typeof RapydSetTransferResponseSchema
>

export const RapydSetTransferResponseRequestSchema = z.object({
  id: z.string(),
  metadata: z.unknown().optional(),
  status: z.enum(['accept', 'decline', 'cancel'])
})

export type RapydSetTransferResponseRequest = z.TypeOf<
  typeof RapydSetTransferResponseRequestSchema
>

export const RapydAccountBalanceSchema = z.object({
  id: z.string(),
  currency: z.string(),
  alias: z.string(),
  balance: z.number(),
  received_balance: z.number(),
  on_hold_balance: z.number(),
  reserve_balance: z.number(),
  limits: z.null(),
  limit: z.null()
})

export type RapydAccountBalance = z.TypeOf<typeof RapydAccountBalanceSchema>

export const RapydDepositRequestSchema = RapydWithdrawRequestSchema

export type RapydDepositRequest = RapydWithdrawRequest

export const RapydDepositResponseSchema = z.object({
  id: z.string(),
  account_id: z.string(),
  phone_number: z.string(),
  amount: z.number(),
  currency: z.string(),
  balance_type: z.string(),
  metadata: z.unknown().optional()
})

export type RapydDepositResponse = z.TypeOf<typeof RapydDepositResponseSchema>

export const RapydHoldRequestSchema = RapydWithdrawRequestSchema

export type RapydHoldRequest = RapydWithdrawRequest

export const RapydHoldResponseSchema = z.object({
  id: z.string(),
  source_transaction_id: z.string(),
  destination_transaction_id: z.string(),
  source_user_profile_id: z.string(),
  destination_user_profile_id: z.string(),
  source_account_id: z.string(),
  destination_account_id: z.string(),
  source_balance_type: z.string(),
  destination_balance_type: z.string(),
  currency_code: z.string(),
  amount: z.number()
})

export type RapydHoldResponse = z.TypeOf<typeof RapydHoldResponseSchema>

export const RapydReleaseRequestSchema = RapydHoldRequestSchema

export type RapydReleaseRequest = RapydHoldRequest

export const RapydReleaseResponseSchema = RapydHoldResponseSchema

export type RapydReleaseResponse = RapydHoldResponse

export const PayoutMethodResponseSchema = z.object({
  payout_method_type: z.string(),
  name: z.string(),
  payout_currencies: z.string()
})

export type PayoutMethodResponse = z.TypeOf<typeof PayoutMethodResponseSchema>

export const WithdrawFundsFromAccountResponseSchema = z.object({
  id: z.string(),
  payout_method_type: z.string(),
  sender_amount: z.number(),
  sender_currency: z.string(),
  status: z.string()
})

export type WithdrawFundsFromAccountResponse = z.TypeOf<
  typeof WithdrawFundsFromAccountResponseSchema
>

export const CompletePayoutRequestSchema = z.object({
  payout: z.string(),
  amount: z.number()
})

export type CompletePayoutRequest = z.TypeOf<typeof CompletePayoutRequestSchema>

export const CompletePayoutResponseSchema =
  WithdrawFundsFromAccountResponseSchema

export type CompletePayoutResponse = WithdrawFundsFromAccountResponse
