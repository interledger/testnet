import { AssetOP, Rates } from '@/lib/api/asset'
import { getCurrencySymbol } from '@/utils/helpers'
import { memo } from 'react'

type ExchangeRateProps = {
  convertAmount: number
  currentExchangeRates: Rates | undefined
  receiverAssetCode: string | null
  selectedAsset: AssetOP | null
}

export const ExchangeRate = memo(
  ({
    convertAmount,
    currentExchangeRates,
    receiverAssetCode,
    selectedAsset
  }: ExchangeRateProps) => {
    if (
      convertAmount &&
      convertAmount !== 0 &&
      currentExchangeRates &&
      !('success' in currentExchangeRates) &&
      receiverAssetCode &&
      selectedAsset &&
      receiverAssetCode !== selectedAsset.assetCode
    ) {
      return (
        <p className="ml-2 text-sm text-green">{`Receiver Payment Pointer asset is in ${getCurrencySymbol(
          receiverAssetCode
        )}. Exchange Rate: ${getCurrencySymbol(
          selectedAsset.assetCode
        )}${convertAmount} = ${getCurrencySymbol(receiverAssetCode)}${(
          convertAmount * currentExchangeRates.rates[receiverAssetCode]
        ).toFixed(selectedAsset.assetScale)}`}</p>
      )
    }

    return null
  }
)
ExchangeRate.displayName = 'ExchangeRate'
