import { SVGProps } from 'react'

export const Bars = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg viewBox="0 0 20 14" {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.5"
        d="M2 2h16.5M2 7.25h8.25M2 12.5h16.5"
      ></path>
    </svg>
  )
}
