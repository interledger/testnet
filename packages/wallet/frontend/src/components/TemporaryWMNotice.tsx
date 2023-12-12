import { Warning } from './icons/Warning'

export const TemporaryWMNotice = ({
  textSize = 'base'
}: {
  textSize?: 'base' | 'lg'
}) => {
  const iconSize = textSize === 'base' ? 'h-6 w-6' : 'h-8 w-8'
  const titleSize = textSize === 'base' ? 'text-base' : 'text-lg'
  const contentSize = textSize === 'base' ? 'text-sm' : 'text-base'
  return (
    <div className="mb-5 max-w-lg rounded-md bg-orange-1 p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <Warning className={`text-orange ${iconSize}`} aria-hidden="true" />
        </div>
        <div className="ml-3">
          <h3 className={`${titleSize} font-semibold text-orange-2`}>Notice</h3>
          <div className={`mt-2 text-orange-2 ${contentSize}`}>
            <p>Web Monetization is exclusively enabled for USD accounts.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
