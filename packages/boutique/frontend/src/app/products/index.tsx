import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading
} from '@/components/page-header.tsx'
import { ProductsList } from './components/products-list.tsx'

export function Component() {
  return (
    <>
      <PageHeader>
        <PageHeaderHeading>Interledger Boutique</PageHeaderHeading>
        <PageHeaderDescription>
          Value or feeling? Explore all here!
        </PageHeaderDescription>
      </PageHeader>
      <ProductsList />
    </>
  )
}
