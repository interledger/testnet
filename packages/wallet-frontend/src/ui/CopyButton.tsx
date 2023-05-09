import { Clipboard, ClipboardCheck } from '@/components/icons/Clipboard'
import { useEffect, useState } from 'react'
import { Button, ButtonProps } from './Button'

function copyToClipboard(value: string) {
  navigator.clipboard.writeText(value)
}

type CopyButtonProps = Omit<ButtonProps, 'intent'> & {
  value: string
}

export const CopyButton = ({ value, ...props }: CopyButtonProps) => {
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
        copyToClipboard(value)
        setIsCopied(true)
      }}
      {...props}
    >
      <span className="sr-only">Copy</span>
      {isCopied ? (
        <ClipboardCheck className="m-0.5 h-7 w-7" />
      ) : (
        <Clipboard className="m-0.5 h-7 w-7" />
      )}
    </Button>
  )
}
