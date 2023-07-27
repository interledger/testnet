import { cx } from 'class-variance-authority'
import { ComponentProps, ReactNode } from 'react'

type TableProps = ComponentProps<'table'> & {
  children: ReactNode
}

export const Table = ({ children, className, ...props }: TableProps) => {
  return (
    <div className="overflow-x-auto">
      <table
        className={cx(className, 'min-w-full table-fixed text-green')}
        {...props}
      >
        {children}
      </table>
    </div>
  )
}

type THeadProps = ComponentProps<'thead'> & {
  columns: string[]
  thProps?: ComponentProps<'th'>
  trProps?: ComponentProps<'tr'>
}

const THead = ({
  columns,
  thProps,
  trProps,
  className,
  ...props
}: THeadProps) => {
  return (
    <thead className={className} {...props}>
      <tr {...trProps}>
        {columns.map((col) => (
          <th
            key={col}
            className="border-b border-green-7 p-4 text-left font-light md:px-3 [&:first-child]:border-none"
            {...thProps}
          >
            {col}
          </th>
        ))}
      </tr>
    </thead>
  )
}

type TBodyProps = ComponentProps<'tbody'> & {
  children: ReactNode
}

const TBody = ({ children, ...props }: TBodyProps) => {
  return <tbody {...props}>{children}</tbody>
}

type TRowProps = ComponentProps<'tr'> & {
  children: ReactNode
}

const TRow = ({ children, className, ...props }: TRowProps) => {
  return (
    <tr className={cx(className, 'hover:bg-white-1')} {...props}>
      {children}
    </tr>
  )
}

type TCellProps = ComponentProps<'td'> & {
  children: ReactNode
}

const TCell = ({ children, className, ...props }: TCellProps) => {
  return (
    <td className={cx(className, 'p-4 md:px-3')} {...props}>
      {children}
    </td>
  )
}

const TShimmer = () => {
  return (
    <div className="flex animate-pulse flex-col space-y-2">
      <div className="h-12 w-full rounded-lg bg-gray-500 bg-opacity-25"></div>
      <div className="h-12 w-full rounded-lg bg-gray-500 bg-opacity-25"></div>
      <div className="h-12 w-full rounded-lg bg-gray-500 bg-opacity-25"></div>
    </div>
  )
}

Table.Head = THead
Table.Body = TBody
Table.Row = TRow
Table.Cell = TCell
Table.Shimmer = TShimmer
