import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading
} from '@/components/page-header.tsx'
import { ProductsList } from './components/products-list.tsx'
import { AnimatedCheckMark } from '@/components/animated-check-mark.tsx'

export function Component() {
  return (
    <>
      <AnimatedCheckMark />
      <PageHeader>
        <PageHeaderHeading>Interledger E-Commerce</PageHeaderHeading>
        <PageHeaderDescription>
          Value or feeling? Explore all here!
        </PageHeaderDescription>
      </PageHeader>
      <ProductsList />
    </>
  )
}
