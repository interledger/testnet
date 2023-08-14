import { createContainer, type Cradle } from '@/container'
import { env } from '@/config/env'
import { createApp, TestApp } from '@/tests/app'
import { AwilixContainer } from 'awilix'
import { Knex } from 'knex'
import { IProductService } from '@/product/service'
import { truncateTables } from '@/tests/tables'
import { randomUUID } from 'crypto'
import { mockProduct } from '../mocks'
import { createProducts } from '../helpers'

describe('Product Service', (): void => {
  let container: AwilixContainer<Cradle>
  let app: TestApp
  let knex: Knex
  let productService: IProductService

  beforeAll(async (): Promise<void> => {
    container = createContainer(env)
    app = await createApp(container)
    knex = app.knex
    productService = container.resolve('productService')
  })

  afterAll(async (): Promise<void> => {
    await app.stop()
    await knex.destroy()
  })

  afterEach(async (): Promise<void> => {
    await truncateTables(knex)
  })

  describe('get', (): void => {
    it('should return undefined if the product does not exist', async (): Promise<void> => {
      await expect(productService.get(randomUUID())).resolves.toBeUndefined()
    })

    it('should return the product with the given id', async (): Promise<void> => {
      const product = mockProduct()
      await createProducts([product])

      await expect(productService.get(product.id)).resolves.toMatchObject(
        product
      )
    })
  })

  describe('list', (): void => {
    it('should return an empty array if there are not products', async (): Promise<void> => {
      await expect(productService.list()).resolves.toStrictEqual([])
    })

    it('should return all the products', async (): Promise<void> => {
      const products = [mockProduct(), mockProduct(), mockProduct()]
      await createProducts(products)

      await expect(productService.list()).resolves.toMatchObject(products)
    })
  })
})
