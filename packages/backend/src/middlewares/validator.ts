import { Request } from 'express'
import { AnyZodObject, z } from 'zod'
import { BadRequestException } from '../shared/models/errors/BadRequestException'

export async function zParse<T extends AnyZodObject>(
  schema: T,
  req: Request
): Promise<z.infer<T>> {
  const res = await schema.safeParseAsync(req.body)
  if (!res.success) {
    const { fieldErrors } = res.error.flatten()
    Object.keys(fieldErrors).forEach((key) => {
      ;(fieldErrors[key] as any) = fieldErrors[key]![0]
    })
    throw new BadRequestException(
      'Invalid input',
      fieldErrors as unknown as Record<string, string>
    )
  }
  return res
}
