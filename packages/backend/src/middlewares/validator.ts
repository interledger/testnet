import { Request } from 'express'
import { AnyZodObject, z } from 'zod'
import { BadRequestException } from '../shared/models/errors/BadRequestException'

export async function zParse<T extends AnyZodObject>(
  schema: T,
  req: Request
): Promise<z.infer<T>> {
  const res = await schema.safeParseAsync(req.body)
  if (!res.success) {
    const errors: Record<string, string> = {}
    res.error.issues.forEach((i) => {
      errors[i.path[0]] = i.message
    })

    throw new BadRequestException('Invalid input', errors)
  }
  return res.data
}
