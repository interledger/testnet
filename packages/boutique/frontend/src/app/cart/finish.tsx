import { useZodSearchParams } from '@/hooks/use-zod-search-params.ts'
import { cn } from '@/lib/utils.ts'
import { useEffect } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { oneClickConfirmationSearchParamsSchema } from '../route-schemas.ts'
import { Loader } from '@/components/loader.tsx'
import { useFinishSetupMutation } from '@/hooks/use-finish-setup-mutation.ts'
import { setToken } from '@/lib/stores/token-store.ts'

export function Component() {
  const navigate = useNavigate()
  const [{ identifier, hash, interact_ref, result }] = useZodSearchParams(
    oneClickConfirmationSearchParamsSchema
  )
  const { mutate, data, error } = useFinishSetupMutation()

  useEffect(() => {
    mutate(
      {
        identifier,
        hash,
        interactRef: interact_ref,
        result
      },
      {
        onSuccess({ data }) {
          setToken(data)
        }
      }
    )
    setTimeout(() => navigate('/cart'), 3000)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (data) {
    let color: string = 'text-turqoise'
    let text: string = 'One click buy was successfully set up!'

    if (result === 'grant_rejected') {
      color = 'text-pink'
      text = 'One click buy setup was canceled.'
    }

    return (
      <div
        className={cn(
          'mt-36 flex min-h-full w-full flex-col items-center gap-y-5',
          color
        )}
      >
        <h1 className={`${color} text-lg font-semibold`}>{text}</h1>
        <p className="font-semibold">Redirecting you back to cart ...</p>
      </div>
    )
  }

  if (error) {
    return <Navigate to="/cart" />
  }

  return <Loader />
}
