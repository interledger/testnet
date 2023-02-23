import { Clipboard, ClipboardCheck } from '@/components/icons/ClipBoard'
import React from 'react'
import { Button, ButtonProps } from './Button'

function copyToClipboard(value: string) {
  navigator.clipboard.writeText(value)
}

type CopyButtonProps = Omit<ButtonProps, 'intent'> & {
  value: string
}

export const CopyButton = ({ value, ...props }: CopyButtonProps) => {
  const [isCopied, setIsCopied] = React.useState(false)

  React.useEffect(() => {
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
      }}
      {...props}
    >
      <span className="sr-only">Copy</span>
      {isCopied ? (
        <ClipboardCheck className="m-0.5 h-8 w-8" />
      ) : (
        <Clipboard className="m-0.5 h-8 w-8" />
      )}
    </Button>
  )
}
