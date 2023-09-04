import { OpenPaymentsLogo } from '@/components/icons'
import { Button } from '@/components/ui/button'

export const PayButton = () => {
  return (
    <Button
      type="submit"
      variant="ghost"
      className="flex h-12 min-w-[90px] max-w-sm items-center justify-center gap-x-2 rounded-md bg-black px-2 text-white shadow-lg focus:outline-none"
      aria-label="pay"
    >
      <OpenPaymentsLogo className="h-6 w-6" />
      <span className="text-xl">Pay</span>
    </Button>
  )
}
