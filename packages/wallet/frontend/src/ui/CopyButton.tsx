import { Clipboard, ClipboardCheck } from '@/components/icons/Clipboard'
import { useEffect, useState } from 'react'
import { Button, ButtonProps } from './Button'
import { cx } from 'class-variance-authority'

function copyToClipboard(value: string, copyType?: string) {
  navigator.clipboard.writeText(copyType === 'base64' ? btoa(value.trim()) : value)
}

type CopyButtonProps = Omit<ButtonProps, 'intent'> & {
  value: string
  ctaText?: string
  afterCtaText?: string
  copyType?: string
}

export const CopyButton = ({
  value,
  afterCtaText,
  ctaText,
  copyType,
  ...props
}: CopyButtonProps) => {
  const [isCopied, setIsCopied] = useState(false)

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
        copyToClipboard(value, copyType)
        setIsCopied(true)
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
