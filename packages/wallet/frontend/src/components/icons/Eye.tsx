import { SVGProps } from 'react'

type EyeProps = SVGProps<SVGSVGElement> & { loading?: boolean }

export const Eye = ({ loading, ...props }: EyeProps) => {
  return (
    <svg
      width="30px"
      height="30px"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={loading ? 'animate-ping' : ''}
      {...props}
    >
      <path
        d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12"
        stroke-width="1"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M1 12C1 12 5 20 12 20C19 20 23 12 23 12"
        stroke-width="1"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <circle
        cx="12"
        cy="12"
        r="3"
        stroke-width="1"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  )
}
