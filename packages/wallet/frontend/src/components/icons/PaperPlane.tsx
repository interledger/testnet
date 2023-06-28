import { SVGProps } from 'react'

export const PaperPlane = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      width="50"
      height="50"
      viewBox="0 0 50 46"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M38.54 44.8002C39.06 45.4502 40.11 45.2002 40.28 44.3802L48.78 2.29024C48.84 1.99024 48.77 1.68024 48.57 1.45024C48.31 1.14024 47.96 1.12024 47.95 1.11024C47.8 1.09024 47.67 1.10024 47.51 1.15024L1.48 15.5702C0.589996 15.8502 0.549996 17.1102 1.43 17.4402L16.5 23.0902L14.64 36.1402C14.64 36.1402 14.64 36.1402 14.64 36.1502C14.54 36.9302 15.35 37.5102 16.06 37.1602L27.77 31.3102L38.57 44.8002H38.54ZM38.76 41.9102C38.13 41.1202 25.44 25.2702 24.85 24.5202L46.24 4.87024L38.76 41.9102ZM4.8 16.5902L41.63 5.05024L17.45 21.3302L4.81 16.5902H4.8ZM18.49 23.0102L37.49 10.2202L22.83 23.6902C22.83 23.6902 22.83 23.6902 22.82 23.7002C22.81 23.7102 22.8 23.7202 22.78 23.7402C22.77 23.7502 22.76 23.7602 22.75 23.7802C22.75 23.7902 22.73 23.8002 22.72 23.8102C22.71 23.8302 22.7 23.8402 22.68 23.8602C22.68 23.8602 22.68 23.8602 22.67 23.8702L17.18 32.1002L18.48 23.0102H18.49ZM18.49 33.7202L23.58 26.0802L26.49 29.7202L18.49 33.7202Z"
        fill="url(#paint0_linear_967_439)"
        stroke="url(#paint1_linear_967_439)"
        strokeWidth="0.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient
          id="paint0_linear_967_439"
          x1="0.769996"
          y1="23.1302"
          x2="48.8"
          y2="23.1302"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#8ED7C6" />
          <stop offset="1" stopColor="#56ADAB" />
        </linearGradient>
        <linearGradient
          id="paint1_linear_967_439"
          x1="0.389996"
          y1="-26.9998"
          x2="49.17"
          y2="-26.9998"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#8ED7C6" />
          <stop offset="1" stopColor="#56ADAB" />
        </linearGradient>
      </defs>
    </svg>
  )
}
