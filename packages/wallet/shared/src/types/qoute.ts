import { AssetOP } from '@/types/asset'

type AmountProps = AssetOP & {
  value: string
}

export interface QuoteResponse {
  id: string
  receiveAmount: AmountProps
  debitAmount: AmountProps
  fee?: AmountProps
}
