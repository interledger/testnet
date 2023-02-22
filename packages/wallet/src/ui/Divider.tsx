import { cx } from 'class-variance-authority'

type DividerProps = {
  content?: string
}

export const Divider = ({ content }: DividerProps) => {
  return (
    <div className="my-10 flex w-full items-center">
      <div className="flex-grow border-t border-blue-2"></div>
      <span className={cx('flex-shrink text-green-3', content ? 'mx-4' : '')}>
        {content}
      </span>
      <div className="flex-grow border-t border-blue-2"></div>
    </div>
  )
}
