type PageHeaderProps = {
  title: string
  message?: string
}

export const PageHeader = ({ title, message }: PageHeaderProps) => {
  return (
    <div className="text-turqoise">
      <h1 className="text-2xl font-semibold transition-all duration-200 md:text-4xl">
        {title}
      </h1>
      <p className="text-lg font-light md:text-lg">{message}</p>
    </div>
  )
}
