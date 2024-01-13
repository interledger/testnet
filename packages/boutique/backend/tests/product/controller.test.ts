import { createContainer, type Cradle } from '@/container'
import { env } from '@/config/env'
import { createApp, TestApp } from '@/tests/app'
import { AwilixContainer } from 'awilix'
import { truncateTables } from '@/tests/tables'
import {
  createRequest,
  createResponse,
  MockRequest,
  MockResponse
} from 'node-mocks-http'
import { NextFunction, Request, Response } from 'express'
import { IProductController } from '@/product/controller'
import { IProductService } from '@/product/service'
import { mockProduct } from '@/tests/mocks'
import { createProducts } from '@/tests/helpers'

describe('Application', (): void => {
  let container: AwilixContainer<Cradle>
  let app: TestApp
  let req: MockRequest<Request>
  let res: MockResponse<Response>
  let productController: IProductController
  let productService: IProductService

  const next = jest.fn() as unknown as NextFunction

  beforeEach((): void => {
    req = createRequest()
    res = createResponse()
  })

  beforeAll(async (): Promise<void> => {
    container = await createContainer(env)
    app = await createApp(container)
    productController = container.resolve('productController')
    productService = container.resolve('productService')
  })

  afterAll(async (): Promise<void> => {
    await app.stop()
    await app.knex.destroy()
  })

  afterEach(async (): Promise<void> => {
    await truncateTables(app.knex)
  })

  describe('list', (): void => {
    it('should return an array with all the products', async (): Promise<void> => {
      await productController.list(req, res, next)
      expect(res.statusCode).toBe(200)
      expect(res._getJSONData()).toMatchObject({
        success: true
      })
      expect(res._getJSONData().data.length).toBe(6)
    })

    it('should return an empty array if there are no products', async (): Promise<void> => {
      await productController.list(req, res, next)
      expect(res.statusCode).toBe(200)
      expect(res._getJSONData()).toMatchObject({
        success: true,
        data: []
      })
    })

    it('should return status 500 on an unexpected error', async (): Promise<void> => {
      const listSpy = jest
        .spyOn(productService, 'list')
        .mockRejectedValueOnce(new Error('Unexpected error'))

      await productController.list(req, res, (err: Error) => {
        next()
        app.errorHandler(err, req, res, next)
      })

      expect(listSpy).toHaveBeenCalledTimes(1)
      expect(next).toHaveBeenCalledTimes(1)
      expect(res.statusCode).toBe(500)
      expect(res._getJSONData()).toMatchObject({
        success: false,
        message: 'Internal Server Error'
      })
    })
  })

  describe('get', (): void => {
    it('should return status 400 if the slug parameter is not provided ', async (): Promise<void> => {
      const getBySlugSpy = jest.spyOn(productService, 'getBySlug')
      await productController.get(req, res, (err: Error) => {
        next()
        app.errorHandler(err, req, res, next)
      })

      expect(getBySlugSpy).toHaveBeenCalledTimes(0)
      expect(next).toHaveBeenCalledTimes(1)
      expect(res.statusCode).toBe(400)
      expect(res._getJSONData()).toMatchObject({
        success: false,
        message: 'Product slug was not provided.'
      })
    })

    it('should return status 404 if the product with the given slug does not exist', async (): Promise<void> => {
      req.params.slug = 'product-slug'
      const getBySlugSpy = jest.spyOn(productService, 'getBySlug')
      await productController.get(req, res, (err: Error) => {
        next()
        app.errorHandler(err, req, res, next)
      })

      expect(getBySlugSpy).toHaveBeenCalledTimes(1)
      expect(next).toHaveBeenCalledTimes(1)
      expect(res.statusCode).toBe(404)
      expect(res._getJSONData()).toMatchObject({
        success: false,
        message: 'Product was not found.'
      })
    })

    it('should return the product', async (): Promise<void> => {
      const product = mockProduct({
        slug: 'my-slug'
      })
      await createProducts([product])

      const getBySlugSpy = jest.spyOn(productService, 'getBySlug')

      req.params.slug = 'my-slug'
      await productController.get(req, res, next)

      expect(getBySlugSpy).toHaveBeenCalledTimes(1)
      expect(next).toHaveBeenCalledTimes(0)
      expect(res.statusCode).toBe(200)
      expect(res._getJSONData()).toMatchObject({
        success: true,
        message: 'SUCCESS',
        data: product
      })
    })
  })
})
