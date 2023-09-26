import { PageHeader, PageHeaderHeading } from '@/components/page-header.tsx'
import { cn } from '@/lib/utils.ts'
import { CartItems } from './components/cart-items.tsx'
import { Summary } from './components/summary.tsx'

const ShoppingCartWrapper = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn(
        'mt-12 lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-12 xl:gap-x-16',
        className
      )}
      {...props}
    />
  )
}

export function Component() {
  return (
    <>
      <PageHeader>
        <PageHeaderHeading>Shopping Cart</PageHeaderHeading>
      </PageHeader>
      <ShoppingCartWrapper>
        <CartItems />
        <Summary />
      </ShoppingCartWrapper>
    </>
  )
}
