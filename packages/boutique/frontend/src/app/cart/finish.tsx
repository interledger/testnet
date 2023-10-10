import { Button, buttonVariants } from '@/components/ui/button.tsx'
import { useZodSearchParams } from '@/hooks/use-zod-search-params.ts'
import { cn } from '@/lib/utils.ts'
import { VariantProps } from 'class-variance-authority'
import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { oneClickConfirmationSearchParamsSchema } from '../route-schemas.ts'
import { Loader } from '@/components/loader.tsx'
import { useFinishSetupMutation } from '@/hooks/use-finish-setup-mutation.ts'
import { setToken } from '@/lib/stores/token-store.ts'

export function Component() {
  const [{ identifier, hash, interact_ref, result }] = useZodSearchParams(
    oneClickConfirmationSearchParamsSchema
  )
  const { mutate, data, error } = useFinishSetupMutation()

  useEffect(() => {
    mutate(
      {
        identifier,
        hash,
        interact_ref,
        result
      },
      {
        onSuccess({ data }) {
          setToken(data.accessToken)
        }
      }
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (data) {
    let color: string = 'text-turqoise'
    let text: string = 'One click buy was successfully set up!'
    let variant: VariantProps<typeof buttonVariants>['variant'] = 'default'

    if (result === 'grant_rejected') {
      color = 'text-pink'
      text = 'One click buy setup was canceled.'
      variant = 'secondary'
    }

    return (
      <div
        className={cn(
          'mt-36 flex min-h-full w-full flex-col items-center gap-y-5',
          color
        )}
      >
        <h1 className={`${color} text-lg font-semibold`}>{text}</h1>
        <Button variant={variant} aria-label="go back to cart">
          Go to cart
        </Button>
      </div>
    )
  }

  if (error) {
    return <Navigate to="/cart" />
  }

  return <Loader />
}
