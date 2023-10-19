import React from 'react'
import { useRouter } from 'next/router'
import { Back } from './icons/Back'

export const BackButton = () => {
  const router = useRouter()

  return (
    <button
      className="flex items-center justify-center md:hidden"
      onClick={() => {
        router.back()
      }}
    >
      <Back className="mr-5 mt-1 h-5 w-5 text-turqoise" />
    </button>
  )
}
