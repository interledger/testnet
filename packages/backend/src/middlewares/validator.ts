// import { HTTP400Error } from '../utils/httpErrors'
import { Request } from 'express'
import { AnyZodObject, z, ZodError } from 'zod'
import { BadRequestException } from '../errors/badRequestException'

export async function zParse<T extends AnyZodObject>(
  schema: T,
  req: Request
): Promise<z.infer<T>> {
  try {
    return schema.parseAsync(req.body)
  } catch (error) {
    if (error instanceof ZodError) {
      throw new BadRequestException(error.errors[0].message)
    }
    throw new BadRequestException(JSON.stringify(error))
  }
}
