import { SVGProps } from 'react'

export const Bars = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="url(#bars-blue-green)"
      strokeWidth={1.5}
      {...props}
    >
      <linearGradient id="bars-blue-green" x1="100%" y1="100%" x2="0%" y2="0%">
        <stop stopColor="#6dd5ed" offset="0%" />
        <stop stopColor="#2193b0" offset="100%" />
      </linearGradient>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 6.75h16.5M3.75 12H12m-8.25 5.25h16.5"
      />
    </svg>
  )
}
