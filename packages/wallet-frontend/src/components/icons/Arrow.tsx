import { SVGProps } from 'react'

export const DIRECTION = {
  up: 'up',
  down: 'down'
} as const

type Direction = keyof typeof DIRECTION

type ArrowProps = SVGProps<SVGSVGElement> & {
  direction?: Direction
}

export const Arrow = ({ direction = DIRECTION.down, ...props }: ArrowProps) => {
  return direction === DIRECTION.down ? (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M9.93874 10.8014C10.4531 10.2808 10.9637 9.75727 11.4825 9.24189C11.7367 8.98903 12.0459 8.9082 12.3907 9.0224C12.7215 9.13214 12.9489 9.37463 12.9615 9.70833C12.9705 9.94859 12.908 10.2645 12.7519 10.4269C11.7121 11.5088 10.6441 12.5648 9.57231 13.6155C9.21852 13.9619 8.72278 13.9596 8.3623 13.6074C7.2987 12.567 6.24552 11.5155 5.2005 10.4558C4.83408 10.0843 4.85043 9.5615 5.1953 9.21742C5.54314 8.87112 6.0597 8.86222 6.43802 9.22113C6.88694 9.64752 7.31654 10.0925 7.75655 10.5285C7.84574 10.6167 7.94162 10.6983 8.09547 10.8377C8.09547 10.6182 8.09547 10.4788 8.09547 10.3401C8.09547 8.63012 8.0925 6.92011 8.0977 5.2101C8.09919 4.71622 8.40541 4.3625 8.85582 4.29651C9.26461 4.23718 9.68677 4.49673 9.80495 4.90384C9.84806 5.0514 9.84732 5.21529 9.84732 5.37175C9.85029 7.04246 9.8488 8.71243 9.8488 10.3831C9.8488 10.5077 9.8488 10.633 9.8488 10.7576C9.87928 10.7717 9.90901 10.7865 9.93874 10.8014Z"
        fill="url(#paint0_linear_817_366)"
      />
      <path
        d="M14.9526 15.0989C16.5513 13.5082 17.4365 11.3919 17.4462 9.13903C17.4559 6.85803 16.584 4.71495 14.9912 3.10431C13.3985 1.49367 11.2646 0.597134 8.98131 0.580078C8.95976 0.580078 8.93895 0.580078 8.91814 0.580078C6.69358 0.580078 4.58795 1.44695 2.98402 3.02571C1.36521 4.61855 0.464392 6.73271 0.446553 8.97886C0.428715 11.3006 1.31393 13.4749 2.93942 15.1026C4.53593 16.7013 6.66088 17.5801 8.92557 17.5801C8.93821 17.5801 8.95084 17.5801 8.96348 17.5801C11.2282 17.5697 13.3546 16.6887 14.9526 15.0989ZM5.91689 2.98344C6.00459 2.93969 6.09229 2.89742 6.18148 2.85812C6.26919 2.81881 6.35689 2.78174 6.44608 2.74614C6.53379 2.71129 6.62149 2.67792 6.71068 2.64677C6.79838 2.61637 6.88609 2.58671 6.97528 2.56001C7.06298 2.53332 7.15143 2.50959 7.23988 2.48734C7.32758 2.46509 7.41603 2.44433 7.50447 2.42579C7.59218 2.40725 7.68062 2.3902 7.76907 2.37463C7.85677 2.35905 7.94522 2.34571 8.03367 2.33384C8.12137 2.32198 8.20982 2.31159 8.29827 2.30344C8.38597 2.29528 8.47442 2.28861 8.56286 2.28416C8.65057 2.27971 8.73901 2.27748 8.82746 2.27674C8.85868 2.276 8.88915 2.27452 8.92037 2.27452C8.93672 2.27452 8.95381 2.27452 8.97091 2.27452C9.01179 2.27452 9.05192 2.27748 9.09206 2.27822C9.18051 2.28045 9.26895 2.28342 9.35666 2.28861C9.4451 2.2938 9.53355 2.30121 9.62125 2.31011C9.7097 2.31901 9.79815 2.33087 9.88585 2.34274C9.9743 2.35535 10.0627 2.36943 10.1504 2.38501C10.2389 2.40058 10.3273 2.41838 10.415 2.43766C10.5035 2.45694 10.5919 2.4777 10.6796 2.50069C10.7681 2.52368 10.8565 2.54815 10.9442 2.57559C11.0334 2.60302 11.1211 2.63268 11.2088 2.66309C11.298 2.69423 11.3857 2.7276 11.4734 2.76246C11.5626 2.79805 11.6503 2.83513 11.738 2.87443C11.8272 2.91447 11.9157 2.956 12.0026 2.99975C12.0918 3.04424 12.1803 3.09096 12.2672 3.1399C12.3564 3.18959 12.4449 3.2415 12.5318 3.29563C12.621 3.35125 12.7095 3.40834 12.7964 3.46841C12.8856 3.52996 12.9741 3.59373 13.061 3.65973C13.151 3.72795 13.2387 3.7984 13.3256 3.87181C13.4156 3.94745 13.504 4.02605 13.5902 4.10688C13.6564 4.16843 13.7225 4.23072 13.7864 4.29524C13.8102 4.31897 13.8318 4.34418 13.8548 4.36791C13.9462 4.46283 14.0339 4.56071 14.1194 4.66008C14.2108 4.76686 14.2993 4.87661 14.384 4.98858C14.4762 5.11094 14.5654 5.23552 14.6486 5.36307C14.743 5.50767 14.8307 5.65598 14.9132 5.80651C15.0091 5.98152 15.0975 6.16097 15.1778 6.34413C15.2789 6.57476 15.3673 6.81131 15.4424 7.05231C15.5695 7.46239 15.6579 7.88656 15.707 8.31962C15.7375 8.58806 15.7538 8.85873 15.7523 9.1331C15.7516 9.38597 15.7352 9.63661 15.707 9.88429C15.6579 10.3122 15.5695 10.7319 15.4424 11.1375C15.3673 11.3755 15.2789 11.6091 15.1778 11.8375C15.0975 12.0192 15.0098 12.1979 14.9132 12.3722C14.8307 12.5212 14.7423 12.6673 14.6486 12.8097C14.5646 12.9372 14.4769 13.0626 14.384 13.1842C14.3 13.2954 14.2108 13.4037 14.1194 13.5097C14.0347 13.6083 13.9462 13.7055 13.8548 13.7997C13.8221 13.8338 13.7909 13.8686 13.7574 13.9013C13.7032 13.9554 13.6467 14.0073 13.5902 14.0592C13.504 14.14 13.4156 14.2179 13.3256 14.2935C13.2387 14.3662 13.151 14.4367 13.061 14.5049C12.9741 14.5709 12.8864 14.6346 12.7964 14.6955C12.7095 14.7548 12.621 14.8126 12.5318 14.8675C12.4449 14.9216 12.3564 14.9728 12.2672 15.0232C12.1803 15.0722 12.0918 15.1189 12.0026 15.1634C11.9157 15.2071 11.8272 15.2494 11.738 15.2887C11.6503 15.328 11.5626 15.3658 11.4734 15.4007C11.3857 15.4355 11.298 15.4689 11.2088 15.5008C11.1211 15.5312 11.0334 15.5608 10.9442 15.5883C10.8565 15.615 10.7681 15.6387 10.6796 15.6624C10.5919 15.6854 10.5035 15.7062 10.415 15.7255C10.3273 15.7447 10.2389 15.7618 10.1504 15.7781C10.0627 15.7937 9.9743 15.8085 9.88585 15.8204C9.79815 15.8322 9.7097 15.8441 9.62125 15.853C9.53355 15.8619 9.4451 15.8678 9.35666 15.873C9.26895 15.8782 9.18051 15.8812 9.09206 15.8834C9.04746 15.8842 9.00287 15.8871 8.95827 15.8871C8.91442 15.8871 8.87131 15.8856 8.82746 15.8849C8.73901 15.8842 8.65057 15.8819 8.56286 15.8775C8.47442 15.873 8.38597 15.8678 8.29827 15.8597C8.20982 15.8515 8.12137 15.8411 8.03367 15.8293C7.94522 15.8182 7.85677 15.8041 7.76907 15.7892C7.68062 15.7744 7.59218 15.7574 7.50447 15.7388C7.41603 15.7203 7.32758 15.7003 7.23988 15.678C7.15143 15.6558 7.06298 15.632 6.97528 15.6061C6.88609 15.5794 6.79838 15.5497 6.71068 15.5201C6.62149 15.4897 6.53379 15.4563 6.44608 15.4222C6.35689 15.3873 6.26919 15.3502 6.18148 15.3109C6.09229 15.2716 6.00459 15.2301 5.91689 15.1864C5.8277 15.1419 5.73925 15.0959 5.65229 15.0477C5.5631 14.998 5.47465 14.9468 5.38769 14.8934C5.2985 14.8386 5.21005 14.7815 5.12309 14.7221C5.0339 14.6613 4.94546 14.5976 4.8585 14.5323C4.76856 14.4648 4.68086 14.3944 4.5939 14.3217C4.50397 14.2461 4.41552 14.1682 4.3293 14.0881C4.26612 14.0288 4.20221 13.9702 4.14052 13.9087C4.1145 13.8827 4.08997 13.8553 4.0647 13.8286C3.97328 13.7344 3.88558 13.6373 3.80011 13.5386C3.70869 13.4326 3.62024 13.3243 3.53551 13.2131C3.44334 13.0922 3.35415 12.9691 3.27091 12.8431C3.17652 12.6999 3.08956 12.5531 3.00631 12.4041C2.91043 12.232 2.82199 12.0563 2.74172 11.8768C2.64138 11.6521 2.55293 11.4215 2.47712 11.1864C2.35745 10.8157 2.26826 10.4345 2.21252 10.0437C2.16347 9.69964 2.13968 9.34889 2.14265 8.99369C2.14488 8.68743 2.16941 8.38488 2.21252 8.08603C2.26826 7.70043 2.35671 7.32224 2.47712 6.95517C2.55293 6.72455 2.64138 6.49912 2.74172 6.27814C2.82199 6.10091 2.91043 5.92664 3.00631 5.75609C3.08881 5.61 3.17726 5.46614 3.27091 5.32525C3.3549 5.19918 3.4426 5.07609 3.53551 4.95521C3.6195 4.84547 3.70869 4.73868 3.80011 4.63264C3.88484 4.53476 3.97328 4.4391 4.0647 4.34492C4.10187 4.3071 4.13754 4.2678 4.17545 4.23072C4.22599 4.18104 4.27802 4.13432 4.3293 4.08612C4.41552 4.00603 4.50397 3.92817 4.5939 3.85253C4.68086 3.77986 4.76856 3.70941 4.8585 3.64193C4.94546 3.57593 5.0339 3.5129 5.12309 3.45135C5.21005 3.39203 5.2985 3.33419 5.38769 3.27931C5.47465 3.22518 5.5631 3.17327 5.65229 3.12359C5.73925 3.07465 5.8277 3.02793 5.91689 2.98344Z"
        fill="url(#paint1_linear_817_366)"
      />
      <defs>
        <linearGradient
          id="paint0_linear_817_366"
          x1="12.9623"
          y1="9.08032"
          x2="4.93119"
          y2="9.08032"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.0016121" stopColor="#8FD8C7" />
          <stop offset="1" stopColor="#56AEAC" />
        </linearGradient>
        <linearGradient
          id="paint1_linear_817_366"
          x1="0.447037"
          y1="9.07979"
          x2="17.4463"
          y2="9.07979"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.0016121" stopColor="#8FD8C7" />
          <stop offset="1" stopColor="#56AEAC" />
        </linearGradient>
      </defs>
    </svg>
  ) : (
    <svg
      width="19"
      height="19"
      viewBox="0 0 19 19"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M8.39681 7.75766C7.85222 8.30885 7.31157 8.86317 6.76227 9.40887C6.49312 9.67661 6.16574 9.76219 5.80059 9.64128C5.45038 9.52507 5.20957 9.26832 5.19619 8.915C5.18675 8.6606 5.25285 8.32612 5.41812 8.15417C6.51909 7.00861 7.64997 5.89053 8.78479 4.77794C9.15939 4.41127 9.6843 4.41362 10.066 4.78658C11.1921 5.88817 12.3073 7.00154 13.4138 8.12355C13.8017 8.51692 13.7844 9.07046 13.4193 9.43478C13.051 9.80145 12.504 9.81087 12.1035 9.43085C11.6281 8.97938 11.1732 8.50828 10.7074 8.0466C10.6129 7.95316 10.5114 7.8668 10.3485 7.71918C10.3485 7.95159 10.3485 8.09921 10.3485 8.24603C10.3485 10.0566 10.3516 11.8672 10.3461 13.6778C10.3446 14.2008 10.0203 14.5753 9.54343 14.6452C9.11059 14.708 8.66359 14.4332 8.53846 14.0021C8.49282 13.8459 8.49361 13.6723 8.49361 13.5067C8.49046 11.7377 8.49203 9.96948 8.49203 8.20049C8.49203 8.06858 8.49203 7.93589 8.49203 7.80398C8.45977 7.78906 8.42829 7.77336 8.39681 7.75766Z"
        fill="url(#paint0_linear_817_372)"
      />
      <path
        d="M15.8059 15.9529C17.4987 14.2687 18.436 12.0278 18.4462 9.6425C18.4564 7.22732 17.5333 4.95818 15.8468 3.25279C14.1604 1.54741 11.901 0.598137 9.48337 0.580078C9.46055 0.580078 9.43852 0.580078 9.41648 0.580078C7.06107 0.580078 4.83158 1.49794 3.13329 3.16957C1.41927 4.85611 0.465456 7.09462 0.446569 9.4729C0.427682 11.9313 1.36497 14.2334 3.08608 15.9568C4.77649 17.6497 7.02645 18.5801 9.42435 18.5801C9.43773 18.5801 9.45111 18.5801 9.46449 18.5801C11.8624 18.5691 14.1139 17.6363 15.8059 15.9529ZM6.23869 3.12481C6.33155 3.07849 6.42441 3.03373 6.51885 2.99212C6.61171 2.9505 6.70457 2.91124 6.79901 2.87356C6.89187 2.83665 6.98474 2.80132 7.07917 2.76834C7.17204 2.73615 7.2649 2.70475 7.35934 2.67648C7.4522 2.64821 7.54585 2.62309 7.6395 2.59953C7.73236 2.57598 7.82601 2.55399 7.91966 2.53436C8.01252 2.51473 8.10617 2.49668 8.19982 2.48019C8.29269 2.4637 8.38634 2.44957 8.47998 2.437C8.57285 2.42444 8.6665 2.41345 8.76015 2.40481C8.85301 2.39617 8.94666 2.38911 9.04031 2.3844C9.13317 2.37969 9.22682 2.37733 9.32047 2.37654C9.35352 2.37576 9.38579 2.37419 9.41884 2.37419C9.43616 2.37419 9.45426 2.37419 9.47236 2.37419C9.51564 2.37419 9.55814 2.37733 9.60063 2.37812C9.69428 2.38047 9.78793 2.38361 9.8808 2.38911C9.97445 2.3946 10.0681 2.40246 10.161 2.41188C10.2546 2.4213 10.3483 2.43386 10.4411 2.44642C10.5348 2.45977 10.6284 2.47469 10.7213 2.49118C10.8149 2.50767 10.9086 2.52651 11.0014 2.54693C11.0951 2.56734 11.1887 2.58933 11.2816 2.61367C11.3753 2.63801 11.4689 2.66392 11.5618 2.69297C11.6562 2.72202 11.7491 2.75343 11.8419 2.78562C11.9364 2.81859 12.0292 2.85393 12.1221 2.89083C12.2165 2.92852 12.3094 2.96778 12.4023 3.00939C12.4967 3.05179 12.5903 3.09576 12.6824 3.14208C12.7769 3.18919 12.8705 3.23866 12.9626 3.29048C13.057 3.34309 13.1507 3.39805 13.2427 3.45537C13.3372 3.51425 13.4308 3.57471 13.5229 3.63831C13.6173 3.70348 13.711 3.771 13.8031 3.84088C13.8983 3.91312 13.9912 3.98771 14.0832 4.06544C14.1785 4.14553 14.2721 4.22876 14.3634 4.31434C14.4334 4.37951 14.5035 4.44547 14.5712 4.51377C14.5963 4.5389 14.6192 4.5656 14.6436 4.59072C14.7404 4.69122 14.8332 4.79487 14.9237 4.90008C15.0205 5.01314 15.1142 5.12935 15.2039 5.24791C15.3015 5.37746 15.3959 5.50937 15.484 5.64442C15.584 5.79753 15.6768 5.95456 15.7642 6.11395C15.8657 6.29925 15.9594 6.48926 16.0444 6.6832C16.1514 6.92738 16.245 7.17785 16.3245 7.43303C16.4591 7.86723 16.5527 8.31635 16.6047 8.77489C16.637 9.05912 16.6543 9.3457 16.6527 9.63622C16.6519 9.90396 16.6346 10.1693 16.6047 10.4316C16.5527 10.8846 16.4591 11.329 16.3245 11.7585C16.245 12.0106 16.1514 12.2579 16.0444 12.4997C15.9594 12.6921 15.8665 12.8813 15.7642 13.0658C15.6768 13.2237 15.5832 13.3783 15.484 13.5291C15.3951 13.6641 15.3023 13.7968 15.2039 13.9256C15.115 14.0434 15.0205 14.158 14.9237 14.2703C14.834 14.3747 14.7404 14.4776 14.6436 14.5773C14.6089 14.6134 14.5759 14.6503 14.5405 14.6849C14.483 14.7422 14.4232 14.7971 14.3634 14.8521C14.2721 14.9377 14.1785 15.0201 14.0832 15.1002C13.9912 15.1772 13.8983 15.2517 13.8031 15.324C13.711 15.3939 13.6181 15.4614 13.5229 15.5258C13.4308 15.5886 13.3372 15.6498 13.2427 15.7079C13.1507 15.7652 13.057 15.8194 12.9626 15.8728C12.8705 15.9246 12.7769 15.9741 12.6824 16.0212C12.5903 16.0675 12.4967 16.1123 12.4023 16.1539C12.3094 16.1955 12.2165 16.2356 12.1221 16.2725C12.0292 16.3094 11.9364 16.3447 11.8419 16.3785C11.7491 16.4107 11.6562 16.4421 11.5618 16.4711C11.4689 16.4994 11.3753 16.5245 11.2816 16.5496C11.1887 16.574 11.0951 16.596 11.0014 16.6164C10.9086 16.6368 10.8149 16.6548 10.7213 16.6721C10.6284 16.6886 10.5348 16.7043 10.4411 16.7169C10.3483 16.7294 10.2546 16.742 10.161 16.7514C10.0681 16.7608 9.97445 16.7671 9.8808 16.7726C9.78793 16.7781 9.69428 16.7813 9.60063 16.7836C9.55342 16.7844 9.5062 16.7875 9.45898 16.7875C9.41255 16.7875 9.3669 16.786 9.32047 16.7852C9.22682 16.7844 9.13317 16.782 9.04031 16.7773C8.94666 16.7726 8.85301 16.7671 8.76015 16.7585C8.6665 16.7498 8.57285 16.7389 8.47998 16.7263C8.38634 16.7145 8.29269 16.6996 8.19982 16.6839C8.10617 16.6682 8.01252 16.6501 7.91966 16.6305C7.82601 16.6109 7.73236 16.5897 7.6395 16.5661C7.54585 16.5426 7.4522 16.5174 7.35934 16.49C7.2649 16.4617 7.17204 16.4303 7.07917 16.3989C6.98474 16.3667 6.89187 16.3314 6.79901 16.2952C6.70457 16.2583 6.61171 16.2191 6.51885 16.1775C6.42441 16.1358 6.33155 16.0919 6.23869 16.0456C6.14425 15.9984 6.0506 15.9498 5.95852 15.8987C5.86409 15.8461 5.77044 15.7919 5.67836 15.7354C5.58393 15.6773 5.49028 15.6168 5.3982 15.554C5.30376 15.4897 5.21011 15.4221 5.11804 15.353C5.02281 15.2816 4.92995 15.207 4.83788 15.13C4.74265 15.05 4.649 14.9675 4.55771 14.8827C4.49082 14.8199 4.42314 14.7579 4.35782 14.6927C4.33028 14.6652 4.30431 14.6362 4.27755 14.6079C4.18075 14.5082 4.08789 14.4053 3.99739 14.3009C3.90059 14.1886 3.80694 14.074 3.71723 13.9562C3.61964 13.8282 3.52521 13.6979 3.43706 13.5644C3.33712 13.4129 3.24504 13.2574 3.1569 13.0996C3.05538 12.9174 2.96173 12.7314 2.87674 12.5413C2.7705 12.3034 2.67685 12.0592 2.59658 11.8104C2.46988 11.4178 2.37544 11.0142 2.31642 10.6004C2.26448 10.2361 2.23929 9.8647 2.24244 9.48861C2.2448 9.16433 2.27077 8.84398 2.31642 8.52756C2.37544 8.11927 2.46909 7.71883 2.59658 7.33018C2.67685 7.08599 2.7705 6.8473 2.87674 6.61332C2.96173 6.42566 3.05538 6.24115 3.1569 6.06056C3.24426 5.90588 3.33791 5.75356 3.43706 5.60437C3.52599 5.4709 3.61886 5.34056 3.71723 5.21258C3.80615 5.09637 3.90059 4.98331 3.99739 4.87103C4.0871 4.76738 4.18075 4.6661 4.27755 4.56638C4.3169 4.52634 4.35468 4.48472 4.39481 4.44547C4.44832 4.39286 4.50341 4.34339 4.55771 4.29236C4.649 4.20756 4.74265 4.12512 4.83788 4.04503C4.92995 3.96808 5.02281 3.89349 5.11804 3.82204C5.21011 3.75216 5.30376 3.68542 5.3982 3.62025C5.49028 3.55744 5.58393 3.4962 5.67836 3.43809C5.77044 3.38078 5.86409 3.32581 5.95852 3.27321C6.0506 3.22139 6.14425 3.17192 6.23869 3.12481Z"
        fill="url(#paint1_linear_817_372)"
      />
      <defs>
        <linearGradient
          id="paint0_linear_817_372"
          x1="5.19513"
          y1="9.58013"
          x2="13.6987"
          y2="9.58013"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.0016121" stopColor="#F297BB" />
          <stop offset="1" stopColor="#E9427D" />
        </linearGradient>
        <linearGradient
          id="paint1_linear_817_372"
          x1="0.447081"
          y1="9.57977"
          x2="18.4463"
          y2="9.57977"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.0016121" stopColor="#F297BB" />
          <stop offset="1" stopColor="#E9427D" />
        </linearGradient>
      </defs>
    </svg>
  )
}
