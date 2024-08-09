import { SVGProps } from 'react'

type PlayProps = SVGProps<SVGSVGElement> & { loading?: boolean }

export const Play = ({ loading, ...props }: PlayProps) => {
  return (
    <svg
      width="49"
      height="55"
      viewBox="0 0 49 55"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={loading ? 'animate-ping' : ''}
      {...props}
    >
      <path d="M45.4301 21.7564C49.5101 24.1164 49.5101 30.0064 45.4301 32.3664L27.3101 42.8264L9.19 53.2865C5.11 55.6465 0 52.6964 0 47.9764V27.0564V6.13644C0 1.41644 5.11 -1.52356 9.19 0.826439L27.3101 11.2865L45.4301 21.7564Z" />
    </svg>
  )
}
