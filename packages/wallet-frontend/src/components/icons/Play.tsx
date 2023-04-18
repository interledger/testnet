import { SVGProps } from 'react'

type PlayProps = SVGProps<SVGSVGElement> & { loading?: boolean }

export const Play = ({ loading, ...props }: PlayProps) => {
  return (
    <svg
      width="40"
      height="44"
      viewBox="0 0 40 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={loading ? 'animate-ping' : ''}
      {...props}
    >
      <path
        d="M36.9501 17.9794C40.2201 19.8694 40.2201 24.5794 36.9501 26.4694L22.4501 34.8394L7.95009 43.2094C4.68009 45.0994 0.600098 42.7394 0.600098 38.9594V22.2194V5.4794C0.600098 1.7094 4.69009 -0.650601 7.95009 1.2294L22.4501 9.59939L36.9501 17.9794Z"
        fill="url(#paint0_linear_473_3152)"
      />
      <defs>
        <linearGradient
          id="paint0_linear_473_3152"
          x1="0.600498"
          y1="22.2242"
          x2="39.3997"
          y2="22.2242"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.0016121" stopColor="#92DBCA" />
          <stop offset="1" stopColor="#56B1AF" />
        </linearGradient>
      </defs>
    </svg>
  )
}
