import {
  Model,
  type ModelOptions,
  type Pojo,
  type QueryContext
} from 'objection'

export abstract class BaseModel extends Model {
  public static get modelPaths(): string[] {
    return [__dirname]
  }

  public id!: string
  public createdAt!: Date
  public updatedAt!: Date

  public $beforeInsert(context: QueryContext): void {
    super.$beforeInsert(context)
    if (!this.createdAt) {
      this.createdAt = new Date()
    }
    this.updatedAt = new Date()
  }

  public $beforeUpdate(_opts: ModelOptions, _queryContext: QueryContext): void {
    this.updatedAt = new Date()
  }

  $formatJson(json: Pojo): Pojo {
    json = super.$formatJson(json)
    return {
      ...json,
      createdAt: json.createdAt.toISOString(),
      updatedAt: json.updatedAt.toISOString()
    }
  }
}
