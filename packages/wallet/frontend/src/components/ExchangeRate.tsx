import { getCurrencySymbol } from '@/utils/helpers'
import { memo } from 'react'
import { SimpleArrow } from './icons/Arrow'
import { ExchangeRates } from '@/lib/api/asset'
import { AssetOP } from '@wallet/shared'

type ExchangeRateProps = {
  convertAmount: number
  currentExchangeRates: ExchangeRates | undefined
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
      receiverAssetCode &&
      selectedAsset &&
      receiverAssetCode !== selectedAsset.assetCode
    ) {
      return (
        <div className="flex flex-col space-y-0">
          <p className="mx-2 text-sm text-green dark:text-green-neon">
            The receiver&apos;s account is in a different currency.
          </p>
          <p className="mx-2 text-sm text-green dark:text-green-neon">
            Exchange rate: {getCurrencySymbol(selectedAsset.assetCode)}&nbsp;
            {currentExchangeRates[selectedAsset.assetCode].toFixed(
              selectedAsset.assetScale
            )}
            &nbsp;
            <SimpleArrow className="inline h-3 w-3" />
            &nbsp;
            {getCurrencySymbol(receiverAssetCode)}&nbsp;
            {currentExchangeRates[receiverAssetCode]}
          </p>
          <p className="mx-2 text-sm text-green dark:text-green-neon">
            Exchanged amount: {getCurrencySymbol(selectedAsset.assetCode)}&nbsp;
            {convertAmount}&nbsp;
            <SimpleArrow className="inline h-3 w-3" />
            &nbsp;
            {`${getCurrencySymbol(receiverAssetCode)} ${(
              convertAmount * currentExchangeRates[receiverAssetCode]
            ).toFixed(selectedAsset.assetScale)}`}
          </p>
        </div>
      )
    }

    return null
  }
)
ExchangeRate.displayName = 'ExchangeRate'
