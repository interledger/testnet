import { cx } from 'class-variance-authority'

type DividerProps = {
  content?: string
}

export const Divider = ({ content }: DividerProps) => {
  return (
    <div className="my-10 flex w-full items-center">
      <div className="flex-grow border-t border-green dark:border-pink-neon"></div>
      <span className={cx('flex-shrink', content ? 'mx-4' : '')}>
        {content}
      </span>
      <div className="flex-grow border-t border-green dark:border-pink-neon"></div>
    </div>
  )
}
