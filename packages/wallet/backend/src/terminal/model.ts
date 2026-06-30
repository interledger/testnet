import { BaseModel } from '@shared/backend'
import { Model } from 'objection'

interface Validation {
  minLength?: number
  maxLength?: number
  pattern?: string
  min?: number
  max?: number
  format?: string
  mustEqual?: boolean
}

enum FieldType {
  TEXT = 'text',
  EMAIL = 'email',
  TEL = 'tel',
  NUMBER = 'number',
  SELECT = 'select',
  CHECKBOX = 'checkbox',
  DATE = 'date'
}

export class FieldDefinitions extends BaseModel {
  static tableName = 'field_definitions'

  public key!: string
  public label!: string
  public description?: string
  public type!: FieldType
  public required!: boolean
  public placeholder?: string
  public order!: number
  public options?: Options[]
  public validation?: Validation
  public format?: string
  public maxLength?: number

  static relationMappings = () => ({
    options: {
      relation: Model.HasManyRelation,
      modelClass: Options,
      join: {
        from: 'field_definitions.id',
        to: 'options.fieldId'
      }
    }
  })
}

export class Options extends BaseModel {
  static tableName = 'options'

  public fieldId?: string
  public value!: string
  public label!: string
}
