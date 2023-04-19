import { cx } from 'class-variance-authority'
import { SVGProps } from 'react'

const DIRECTION = {
  up: 'rotate-90',
  down: '-rotate-90',
  left: 'rotate-0',
  right: 'rotate-180'
} as const

type Direction = keyof typeof DIRECTION

type ArrowProps = SVGProps<SVGSVGElement> & {
  direction?: Direction
}

export const Arrow = ({
  className,
  direction = 'left',
  ...props
}: ArrowProps) => {
  return (
    <svg
      width="12"
      height="7"
      viewBox="0 0 12 7"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cx(className, DIRECTION[direction])}
      {...props}
    >
      <path
        opacity="0.3"
        d="M0.31 4.07005L1.78 5.12004L3.25 6.17006C3.58 6.41006 3.98999 6.11006 3.98999 5.64006V4.52004H11.07C11.48 4.52004 11.82 4.10004 11.82 3.59004C11.82 3.08004 11.49 2.66005 11.07 2.66005H3.98999V1.43004C3.98999 0.960039 3.58 0.66004 3.25 0.90004L1.78 1.95006L0.31 3.00005C-0.02 3.24005 -0.02 3.84005 0.31 4.07005Z"
        fill="#003A2F"
      />
    </svg>
  )
}
