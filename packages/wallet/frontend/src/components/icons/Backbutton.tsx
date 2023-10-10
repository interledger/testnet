import React from 'react'
import { useRouter } from 'next/router'
export default function Backbutton() {
  const router = useRouter()
  return (
    <button
      className="flex-start mr-5 mt-[5px] flex h-5 w-5 scale-125 items-center bg-[url('/backButton.svg')] bg-no-repeat active:scale-100 md:hidden"
      onClick={() => {
        router.back()
      }}
    ></button>
  )
}
