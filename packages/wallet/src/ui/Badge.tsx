type BadgeProps = {
  text: string
}

export const Badge = ({ text }: BadgeProps) => {
  return (
    <>
      <span className="inline-flex w-10 justify-center rounded-md bg-gradient-to-r from-[#92DBCA] to-[#56B1AF] text-sm text-white">
        {text}
      </span>
    </>
  )
}
