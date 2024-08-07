import { Clipboard, ClipboardCheck } from '@/components/icons/Clipboard'
import { useEffect, useState } from 'react'
import { Button, ButtonProps } from './Button'
import { useOnboardingContext } from '@/lib/context/onboarding'

export function copyToClipboard(value: string) {
  navigator.clipboard.writeText(value)
}

type CopyButtonProps = Omit<ButtonProps, 'intent'> & {
  value: string
  ctaText?: string
  afterCtaText?: string
}

export const CopyButton = ({
  value,
  afterCtaText,
  ctaText,
  ...props
}: CopyButtonProps) => {
  const [isCopied, setIsCopied] = useState(false)
  const { stepIndex, setStepIndex, isUserFirstTime, isDevKeysOnboarding } =
    useOnboardingContext()

  useEffect(() => {
    setTimeout(() => {
      setIsCopied(false)
    }, 4000)
  }, [isCopied])

  return (
    <Button
      intent="primary"
      onClick={() => {
        copyToClipboard(value)
        setIsCopied(true)
        if (isUserFirstTime || isDevKeysOnboarding) {
          setStepIndex(stepIndex + 1)
        }
      }}
      {...props}
    >
      <div className="flex items-center justify-center">
        <span className="sr-only">Copy</span>
        {isCopied ? (
          <ClipboardCheck className="mx-0.5 h-6 w-6" />
        ) : (
          <Clipboard className="mx-0.5 h-6 w-6" />
        )}
        {afterCtaText && isCopied ? afterCtaText : ctaText}
      </div>
    </Button>
  )
}
