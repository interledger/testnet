import { Request } from 'express'
import { AnyZodObject, z, ZodError } from 'zod'
import { BadRequestException } from '../shared/models/errors/BadRequestException'

export async function zParse<T extends AnyZodObject>(
  schema: T,
  req: Request
): Promise<z.infer<T>> {
  try {
    const res = await schema.parseAsync(req.body)
    return res
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = error?.errors?.reduce((acc, error) => {
        const newAcc = {
          ...acc,
          [error.path[0]]: error.message
        }
        return newAcc
      }, {})

      throw new BadRequestException('Invalid input', errors)
    }
    throw new BadRequestException(JSON.stringify(error))
  }
}
