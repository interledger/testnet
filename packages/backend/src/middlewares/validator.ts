// import { HTTP400Error } from '../utils/httpErrors'
import { Schema, ZodError } from 'zod'
import { Request, Response, NextFunction } from 'express'
import { BadRequestException } from '../errors/badRequestException'

export function validate(schema: Schema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body)
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException(error.errors[0].message)
      }
      next(error)
    }
  }
}
