import { SVGProps } from 'react'

export const X = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="url(#x-blue-green)"
      strokeWidth={1.5}
      {...props}
    >
      <linearGradient id="x-blue-green" x1="100%" y1="100%" x2="0%" y2="0%">
        <stop stopColor="#92dbca" offset="0%" />
        <stop stopColor="#56b1af" offset="100%" />
      </linearGradient>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  )
}
