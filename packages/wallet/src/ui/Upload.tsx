import { SVGProps } from 'react'

type FileUploadProps = {
  label?: string
}

export const FileUpload = ({ label }: FileUploadProps) => {
  return (
    <label
      htmlFor="dropzone-file"
      className="my-5 mr-5 flex w-24 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-brand-turqoise bg-white hover:border-brand-orange"
    >
      <div className="flex flex-col items-center justify-center pt-5 pb-6">
        <UploadSmile />
        <span className="text-md pt-2 font-light text-brand-turqoise">
          {label}
        </span>
      </div>
      <input id="dropzone-file" type="file" className="hidden" />
    </label>
  )
}

const UploadSmile = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      width="20"
      height="21"
      viewBox="0 0 20 21"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M18.3902 19.2102C18.3902 18.2602 18.3802 17.3702 18.3902 16.4702C18.3902 16.0002 18.6302 15.7002 19.0002 15.6502C19.4602 15.5802 19.8702 15.9002 19.8702 16.3902C19.8902 17.5602 19.8902 18.7302 19.8702 19.9002C19.8602 20.3602 19.5602 20.6402 19.1002 20.6402C17.9302 20.6502 16.7602 20.6502 15.5902 20.6402C15.1402 20.6402 14.8002 20.2902 14.8202 19.8902C14.8302 19.5002 15.1502 19.2002 15.6002 19.1902C16.3902 19.1802 17.1702 19.1902 17.9602 19.1902C18.0902 19.2102 18.2202 19.2102 18.3902 19.2102Z"
        fill="url(#paint0_linear_473_2636)"
      />
      <path
        d="M1.52055 19.1901C2.50055 19.1901 3.43056 19.1801 4.35056 19.1901C4.74056 19.1901 5.02056 19.4301 5.07056 19.7701C5.13056 20.1301 4.93055 20.4901 4.59055 20.6101C4.48055 20.6501 4.35055 20.6601 4.23055 20.6601C3.13055 20.6601 2.03054 20.6701 0.930542 20.6601C0.330542 20.6601 0.0705469 20.3901 0.0605469 19.8001C0.0605469 18.6901 0.0605469 17.5801 0.0605469 16.4701C0.0605469 15.9501 0.360552 15.6201 0.800552 15.6301C1.23055 15.6401 1.50055 15.9501 1.50055 16.4601C1.52055 17.3501 1.52055 18.2401 1.52055 19.1901Z"
        fill="url(#paint1_linear_473_2636)"
      />
      <path
        d="M18.4306 2.28093C17.5706 2.28093 16.7506 2.28093 15.9306 2.28093C15.7706 2.28093 15.6106 2.28093 15.4606 2.25093C15.0906 2.18093 14.8406 1.87093 14.8706 1.50093C14.8906 1.15093 15.1506 0.850937 15.5206 0.850937C16.7606 0.830938 18.0106 0.830938 19.2506 0.850937C19.6506 0.860937 19.8806 1.14094 19.8806 1.54094C19.8806 2.70094 19.8806 3.86092 19.8806 5.02092C19.8806 5.51092 19.5706 5.85094 19.1506 5.85094C18.7306 5.85094 18.4306 5.51092 18.4306 5.02092C18.4206 4.13092 18.4306 3.24093 18.4306 2.28093Z"
        fill="url(#paint2_linear_473_2636)"
      />
      <path
        d="M1.51096 2.28051C1.51096 3.17051 1.51096 4.0005 1.51096 4.8305C1.51096 5.0005 1.51098 5.1705 1.46098 5.3305C1.37098 5.6705 1.03097 5.89051 0.690972 5.84051C0.310972 5.79051 0.0709766 5.55053 0.0709766 5.17053C0.0609766 3.97053 0.0609766 2.7805 0.0709766 1.5805C0.0709766 1.1105 0.340977 0.840508 0.820977 0.840508C1.98098 0.830508 3.14097 0.830508 4.30097 0.840508C4.76097 0.840508 5.09097 1.17052 5.09097 1.57052C5.08097 1.97052 4.78098 2.2705 4.32098 2.2705C3.54098 2.2805 2.75097 2.28051 1.97097 2.28051C1.83097 2.28051 1.70096 2.28051 1.51096 2.28051Z"
        fill="url(#paint3_linear_473_2636)"
      />
      <path
        d="M9.91001 15.0601C8.87001 15.0201 7.89 14.7902 7.09 14.0702C6.71 13.7302 6.66001 13.4001 6.91001 13.1101C7.16001 12.8201 7.50001 12.8502 7.88001 13.1702C8.87001 14.0302 10.97 14.0302 11.97 13.1702C12.33 12.8602 12.71 12.8401 12.95 13.1201C13.18 13.4001 13.13 13.7301 12.78 14.0501C11.97 14.7901 10.98 15.0301 9.91001 15.0601Z"
        fill="url(#paint4_linear_473_2636)"
      />
      <path
        d="M14.4705 7.55008C14.4805 8.37008 13.8405 9.02009 13.0205 9.03009C12.1805 9.04009 11.5205 8.38008 11.5205 7.55008C11.5305 6.75008 12.1905 6.08008 12.9905 6.08008C13.8005 6.09008 14.4605 6.74008 14.4705 7.55008Z"
        fill="url(#paint5_linear_473_2636)"
      />
      <path
        d="M8.36015 7.54995C8.37015 8.36995 7.73015 9.01996 6.92015 9.02996C6.08015 9.03996 5.41016 8.37996 5.41016 7.55996C5.42016 6.75996 6.09016 6.08996 6.88016 6.08996C7.69016 6.07996 8.35015 6.73995 8.36015 7.54995Z"
        fill="url(#paint6_linear_473_2636)"
      />
      <defs>
        <linearGradient
          id="paint0_linear_473_2636"
          x1="14.8224"
          y1="18.1522"
          x2="19.8889"
          y2="18.1522"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.0016121" stopColor="#92DBCA" />
          <stop offset="1" stopColor="#56B1AF" />
        </linearGradient>
        <linearGradient
          id="paint1_linear_473_2636"
          x1="0.0702469"
          y1="18.1437"
          x2="5.08816"
          y2="18.1437"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.0016121" stopColor="#92DBCA" />
          <stop offset="1" stopColor="#56B1AF" />
        </linearGradient>
        <linearGradient
          id="paint2_linear_473_2636"
          x1="14.862"
          y1="3.34494"
          x2="19.8787"
          y2="3.34494"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.0016121" stopColor="#92DBCA" />
          <stop offset="1" stopColor="#56B1AF" />
        </linearGradient>
        <linearGradient
          id="paint3_linear_473_2636"
          x1="0.0671766"
          y1="3.34701"
          x2="5.08497"
          y2="3.34701"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.0016121" stopColor="#92DBCA" />
          <stop offset="1" stopColor="#56B1AF" />
        </linearGradient>
        <linearGradient
          id="paint4_linear_473_2636"
          x1="6.756"
          y1="13.9878"
          x2="13.0914"
          y2="13.9878"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.0016121" stopColor="#92DBCA" />
          <stop offset="1" stopColor="#56B1AF" />
        </linearGradient>
        <linearGradient
          id="paint5_linear_473_2636"
          x1="11.5245"
          y1="7.55688"
          x2="14.4667"
          y2="7.55688"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.0016121" stopColor="#92DBCA" />
          <stop offset="1" stopColor="#56B1AF" />
        </linearGradient>
        <linearGradient
          id="paint6_linear_473_2636"
          x1="5.41416"
          y1="7.55676"
          x2="8.36325"
          y2="7.55676"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.0016121" stopColor="#92DBCA" />
          <stop offset="1" stopColor="#56B1AF" />
        </linearGradient>
      </defs>
    </svg>
  )
}
