import { AssetOP, Rates } from '@/lib/api/asset'
import { getCurrencySymbol } from '@/utils/helpers'
import { memo } from 'react'
import { SimpleArrow } from './icons/Arrow'

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
        <div className="flex flex-col space-y-0">
          <p className="mx-2 text-sm text-green">
            The receiver&apos;s account is in a different currency.
          </p>
          <p className="mx-2 text-sm text-green">
            Exchange rate: {getCurrencySymbol(selectedAsset.assetCode)}1
            <SimpleArrow className="inline h-3 w-3" />
            {getCurrencySymbol(receiverAssetCode)}
            {currentExchangeRates.rates[receiverAssetCode]}
          </p>
          <p className="mx-2 text-sm text-green">
            Amount: {getCurrencySymbol(selectedAsset.assetCode)}
            {convertAmount}
            <SimpleArrow className="inline h-3 w-3" />
            {`${getCurrencySymbol(receiverAssetCode)}${(
              convertAmount * currentExchangeRates.rates[receiverAssetCode]
            ).toFixed(selectedAsset.assetScale)}`}
          </p>
        </div>
      )
    }

    return null
  }
)
ExchangeRate.displayName = 'ExchangeRate'
