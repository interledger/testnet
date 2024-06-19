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
      <Back className="text-green h-4 w-4" />
    </button>
  )
}
