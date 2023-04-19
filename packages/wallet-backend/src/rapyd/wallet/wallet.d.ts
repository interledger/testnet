interface RapydBusinessDetail {
  id?: string
  address?: RapydAddress
  annual_revenue?: number
  cnae_code?: string
  created_at?: number
  entity_type?:
    | 'sole_prop'
    | 'partnership'
    | 'company'
    | 'government'
    | 'charity'
    | 'NPO'
    | 'association'
    | 'trust'
  establishment_date?: string
  industry_category?: string
  industry_sub_category?: string
  legal_entity_type?: string
  name?: string
  registration_number?: string
}

interface RapydAddress {
  id?: string
  address?: string
  canton?: string
  city?: string
  country?: string
  created_at?: number
  district?: string
  line_1?: string
  line_2?: string
  line_3?: string
  metadata?: object
  name?: string
  phone_number?: string
  state?: string
  updated_at?: number
  zip?: string
}

interface RapydIssueCardData {
  preferred_name?: string
  transaction_permissions?: 'allowed' | 'not_allowed'
  role_in_company?: 'owner' | 'agent' | 'employee'
}

interface RapydWalletContact {
  id?: string
  address?: RapydAddress | string
  business_details?: RapydBusinessDetail
  compliance_profile?: 1 | 0 | -1
  contact_type?: 'personal' | 'business'
  country?: string
  created_at?: number
  date_of_birth?: string
  email?: string
  ewallet?: string
  first_name?: string
  gender?: 'male' | 'female' | 'other' | 'not_applicable'
  house_type?:
    | 'lease'
    | 'live_with_family'
    | 'own'
    | 'owner'
    | 'month_to_month'
    | 'housing_project'
  identification_number?: string
  identification_type?: string
  issued_card_data?: RapydIssueCardData
  last_name?: string
  marital_status?:
    | 'married'
    | 'single'
    | 'divorced'
    | 'widowed'
    | 'cohabiting'
    | 'not_applicable'
  metadata?: object
  middle_name?: string
  mothers_name?: string
  nationality?: string
  phone_number?: string
  second_last_name?: string
  send_notifications?: bool
  verification_status?: 'not verified' | 'KYCd'
}

interface RapydWalletContacts {
  data?: Array<RapydWalletContact>
  has_more?: bool
  total_count?: number
  url?: string
}

interface RapydAccount {
  id?: string
  alias?: string
  balance?: number
  currency?: string
  limit?: number
  limits?: number
  on_hold_balance?: number
  received_balance?: number
  reserve_balance?: number
}

interface RapydWallet {
  id?: string
  accounts?: Array<RapydAccount>
  category?: 'collect' | 'disburse' | 'card_authorization' | 'general'
  contact?: RapydWalletContact
  email?: string
  ewallet_reference_id?: string
  first_name?: string
  last_name?: string
  metadata?: object
  phone_number?: string
  status?: 'ACT' | 'DIS'
  type?: 'company' | 'person' | 'client'
  verification_status?: 'not verified' | 'KYCd'
}

interface RapydProfile {
  ewallet?: string
  first_name?: string
  last_name?: string
}

interface RapydIdentityRequest {
  reference_id?: string
  ewallet?: string
  country?: string
  document_type?: string
  front_side_image?: string
  front_side_image_mime_type?: string
  face_image?: string
  face_image_mime_type?: string
}

interface RapydWithdrawRequest {
  ewallet: string
  amount: number
  currency: string
}

interface RapydTransferRequest {
  source_ewallet: string
  amount: number
  currency: string
  destination_ewallet: string
}

interface RapydSetTransferResponseRequest {
  id: string
  metadata?: unknown
  status: 'accept' | 'decline' | 'cancel'
}

type RapydDepositRequest = RapydWithdrawRequest
type RapydHoldRequest = RapydWithdrawRequest
type RapydReleaseRequest = RapydHoldRequest
