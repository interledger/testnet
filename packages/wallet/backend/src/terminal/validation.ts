import { z } from 'zod'
import countries from 'i18n-iso-countries'
import { FieldDefinitions, Validation } from './model'

export async function requestSchema(fields: FieldDefinitions[]) {
  return z.object({
    body: await buildSchema(fields)
  })
}

function stringValidation(
  schema: z.ZodString,
  validation?: Validation,
  fieldName?: string
): z.ZodTypeAny {
  if (!validation) {
    return schema
  }
  if (validation.minLength) {
    schema = schema.min(validation.minLength, {
      message: `${fieldName} must be at least ${validation.minLength} characters`
    })
  }
  if (validation.maxLength) {
    schema = schema.max(validation.maxLength, {
      message: `${fieldName} must be at most ${validation.maxLength} characters`
    })
  }
  if (validation.pattern) {
    schema = schema.regex(new RegExp(validation.pattern), {
      message: `${fieldName} has an invalid format, expected - ${new RegExp(validation.pattern)}`
    })
  }

  return schema
}

export async function buildSchema(fields: FieldDefinitions[]) {
  const schemaShape: Record<string, z.ZodTypeAny> = {}
  for (const field of fields) {
    let schema: z.ZodTypeAny

    const optionValues = field.options
      ? field.options?.map((option) => option.value)
      : undefined

    switch (field.type) {
      case 'text':
        schema = stringValidation(
          z.string({ required_error: `${field.key} is required` }),
          field.validation,
          field.key
        )
        switch (field.validation?.format) {
          case 'payment-pointer':
            schema = z
              .string()
              .trim()
              .url()
              .refine((value) => value.startsWith('https://'), {
                message:
                  'PAYMENT_POINTER must be a URL starting with https:// instead of the classic "$" format'
              })

            break

          case 'iso-country':
            schema = z
              .string({ required_error: `${field.key} is required` })
              .refine(
                (value) => {
                  const isValid = countries.isValid(value)
                  return isValid
                },
                {
                  message: `${field.key} does not contain a valid country-code`
                }
              )
        }

        break

      case 'email':
        schema = stringValidation(
          z.string({ required_error: `${field.key} is required` }).email(),
          field.validation,
          field.key
        )

        break

      case 'number':
        schema = z.number({
          required_error: `${field.key} is required`
        })

        if (field.validation?.min !== undefined) {
          schema = (schema as z.ZodNumber).min(field.validation.min as number, {
            message: `${field.key} must be min ${field.validation.min}`
          })
        }

        if (field.validation?.max !== undefined) {
          schema = (schema as z.ZodNumber).max(field.validation.max as number, {
            message: `${field.key} must be max ${field.validation.max}`
          })
        }

        break

      case 'tel':
        schema = stringValidation(
          z
            .string({ required_error: `${field.key} is required` })
            .regex(/^\+?[0-9]+$/, 'Invalid phone number'),
          field.validation,
          field.key
        )

        break

      case 'checkbox':
        schema = z
          .boolean({ required_error: `${field.key} is required` })
          .refine((value) => value === field.validation?.mustEqual, {
            message: `${field.key} must be ${field.validation?.mustEqual}`
          })

        break

      case 'date':
        schema = z.coerce.date({ required_error: `${field.key} is required` })

        if (field.validation?.min !== undefined) {
          const minDate = new Date(field.validation.min)
          schema = schema.refine((date) => date >= minDate, {
            message: `Date must be equal or bigger than ${field.validation.min}`
          })
        }

        if (field.validation?.max !== undefined) {
          const maxDate = new Date(field.validation.max)

          schema = schema.refine((date) => date <= maxDate, {
            message: `Date must be equal or lower than ${field.validation.max}`
          })
        }

        break

      case 'select':
        schema = z
          .string({ required_error: `${field.key} is required` })
          .refine((value) => optionValues?.includes(value), {
            message: `Invalid value for ${field.key}`
          })

        break

      default:
        schema = z.string().refine(() => {}, {
          message: `something went wrong with this key - ${field.key}`
        })
    }

    if (!field.required) {
      schema = schema.optional()
    }

    schemaShape[field.key] = schema
  }

  return z.object(schemaShape)
}
