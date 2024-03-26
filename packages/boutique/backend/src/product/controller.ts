import { NextFunction, Request } from 'express'
import { IProductService } from './service'
import { Product } from './model'
import { BadRequest, Controller, toSuccessResponse } from '@shared/backend'
import { Logger } from 'winston'

interface GetParams {
  slug?: string
}

export interface IProductController {
  get: Controller<Product>
  list: Controller<Product[]>
}

export class ProductController implements IProductController {
  constructor(
    private productService: IProductService,
    private logger: Logger
  ) {}

  public async get(
    req: Request<GetParams>,
    res: TypedResponse<Product>,
    next: NextFunction
  ) {
    try {
      const { params } = req
      if (!params.slug) {
        this.logger.error(
          'Attempting to fetch a product without the slug parameter provided.'
        )
        throw new BadRequest('Product slug was not provided.')
      }

      const product = await this.productService.getBySlug(params.slug)

      res.status(200).json(toSuccessResponse(product))
    } catch (err) {
      next(err)
    }
  }

  public async list(
    _req: Request,
    res: TypedResponse<Product[]>,
    next: NextFunction
  ) {
    try {
      const products = await this.productService.list()
      res.status(200).json(toSuccessResponse(products))
    } catch (err) {
      this.logger.error(err)
      next(err)
    }
  }
}
