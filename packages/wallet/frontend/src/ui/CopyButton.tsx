import { Clipboard, ClipboardCheck } from '@/components/icons/Clipboard'
import { useEffect, useState } from 'react'
import { Button, ButtonProps } from './Button'
import { cx } from 'class-variance-authority'
import { useOnboardingContext } from '@/lib/context/onboarding'

function copyToClipboard(value: string) {
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
      intent="outline"
      size="sm"
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
          <ClipboardCheck
            className={cx('m-0.5', props.size === 'sm' ? 'h-4 w-4' : 'h-7 w-7')}
          />
        ) : (
          <Clipboard
            className={cx('m-0.5', props.size === 'sm' ? 'h-4 w-4' : 'h-7 w-7')}
          />
        )}
        {afterCtaText && isCopied ? afterCtaText : ctaText}
      </div>
    </Button>
  )
}
