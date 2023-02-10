type DividerProps = {
  content?: string
}

export const Divider = ({ content }: DividerProps) => {
  return (
    <div className="my-10 flex w-full items-center">
      <div className="flex-grow border-t border-brand-blue-2"></div>
      <span className="mx-4 flex-shrink text-brand-green-3">{content}</span>
      <div className="flex-grow border-t border-brand-blue-2"></div>
    </div>
  )
}
