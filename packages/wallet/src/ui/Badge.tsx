type BadgeProps = {
  text: string
}

export const Badge = ({ text }: BadgeProps) => {
  return (
    <>
      <span className="inline-flex w-10 justify-center rounded-md bg-gradient-to-r from-green-5 to-green-6 text-sm text-white">
        {text}
      </span>
    </>
  )
}
