export interface FieldErrorProps {
  error?: string
}

export const FieldError = ({ error }: FieldErrorProps) => {
  if (!error) return null
  return (
    <div className="mt-1 text-sm text-pink-dark dark:text-pink-light">
      {error}
    </div>
  )
}
