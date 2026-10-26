import { Logger } from 'winston'
import { FieldDefinitions } from './model'

export class TerminalService {
  constructor(private logger: Logger) {}

  async getOnboardingFormDefinition(): Promise<FieldDefinitions[]> {
    const fields = await FieldDefinitions.query()
      .withGraphFetched('options')
      .orderBy('order', 'asc')

    this.logger.debug('Returning merchant onboarding form definition', {
      fields: fields
    })

    return fields.map((field) => {
      const mapped = {
        key: field.key,
        label: field.label,
        type: field.type,
        required: field.required,
        order: field.order
      } as Partial<FieldDefinitions>

      if (field.description) mapped.description = field.description
      if (field.placeholder) mapped.placeholder = field.placeholder
      if (field.format)
        mapped.validation = {
          ...(mapped.validation || {}),
          format: field.format
        }
      if (field.maxLength)
        mapped.validation = {
          ...(mapped.validation || {}),
          maxLength: field.maxLength
        }
      if (field.options?.length) {
        mapped.options = field.options.map((opt) => ({
          ...(opt.value && { value: opt.value }),
          ...(opt.label && { label: opt.label })
        })) as FieldDefinitions['options']
      }

      return mapped as FieldDefinitions
    })
  }

  async getAllOnboardingFormDefinitions(): Promise<FieldDefinitions[]> {
    const fields = await FieldDefinitions.query()
      .withGraphFetched('options')
      .orderBy('order', 'asc')

    this.logger.debug('Returning merchant onboarding form definition', {
      fields: fields
    })

    return fields.map((field) => {
      const mapped = {
        key: field.key,
        label: field.label,
        type: field.type,
        required: field.required,
        order: field.order
      } as Partial<FieldDefinitions>

      if (field.description) mapped.description = field.description
      if (field.placeholder) mapped.placeholder = field.placeholder
      if (field.format)
        mapped.validation = {
          ...(mapped.validation || {}),
          format: field.format
        }
      if (field.maxLength)
        mapped.validation = {
          ...(mapped.validation || {}),
          maxLength: field.maxLength
        }
      if (field.minLength)
        mapped.validation = {
          ...(mapped.validation || {}),
          minLength: field.minLength
        }
      if (field.pattern)
        mapped.validation = {
          ...(mapped.validation || {}),
          pattern: field.pattern
        }
      if (field.min)
        mapped.validation = {
          ...(mapped.validation || {}),
          min: field.min
        }
      if (field.max)
        mapped.validation = {
          ...(mapped.validation || {}),
          max: field.max
        }
      if (field.mustEqual)
        mapped.validation = {
          ...(mapped.validation || {}),
          mustEqual: field.mustEqual
        }
      if (field.options?.length) {
        mapped.options = field.options.map((opt) => ({
          ...(opt.value && { value: opt.value }),
          ...(opt.label && { label: opt.label })
        })) as FieldDefinitions['options']
      }

      return mapped as FieldDefinitions
    })
  }
}
