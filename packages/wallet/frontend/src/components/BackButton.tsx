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
      <Back className="h-4 w-4 text-green dark:text-pink-neon" />
    </button>
  )
}
