import { SVGProps } from 'react'

export const Eye = (props: SVGProps<SVGSVGElement>) => {
  return (
    // <svg
    //   width="30px"
    //   height="30px"
    //   viewBox="0 0 24 24"
    //   fill="none"
    //   stroke="currentColor"
    //   xmlns="http://www.w3.org/2000/svg"
    //   {...props}
    // >
    //   <path
    //     d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12"
    //     strokeWidth="1"
    //     strokeLinecap="round"
    //     strokeLinejoin="round"
    //   />
    //   <path
    //     d="M1 12C1 12 5 20 12 20C19 20 23 12 23 12"
    //     strokeWidth="1"
    //     strokeLinecap="round"
    //     strokeLinejoin="round"
    //   />
    //   <circle
    //     cx="12"
    //     cy="12"
    //     r="3"
    //     strokeWidth="1"
    //     strokeLinecap="round"
    //     strokeLinejoin="round"
    //   />
    // </svg>

    <svg
      width="30"
      height="30"
      viewBox="0 0 534 667"
      fill="none"
      stroke="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M66.6667 366.667C66.6667 300.017 90.6067 222.928 129.618 162.945C169.31 101.917 218.837 66.6667 266.667 66.6667C314.497 66.6667 364.023 101.917 403.713 162.945C442.727 222.928 466.667 300.017 466.667 366.667C466.667 499.853 373.083 600 266.667 600C160.251 600 66.6667 499.853 66.6667 366.667ZM266.667 0C185.629 0 118.49 57.7783 73.7317 126.598C28.2933 196.463 0 286.04 0 366.667C0 528.033 115.349 666.667 266.667 666.667C417.983 666.667 533.333 528.033 533.333 366.667C533.333 286.04 505.04 196.463 459.6 126.598C414.843 57.7783 347.703 0 266.667 0ZM216.667 266.663C244.28 266.663 266.667 244.277 266.667 216.663C266.667 189.048 244.28 166.663 216.667 166.663C189.052 166.663 166.667 189.048 166.667 216.663C166.667 244.277 189.052 266.663 216.667 266.663Z"
        stroke="currentColor"
        strokeWidth="1"
        fill="currentColor"
      />
    </svg>
  )
}
