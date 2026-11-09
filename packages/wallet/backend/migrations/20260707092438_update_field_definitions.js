const fields = [
  {
    key: 'telephoneNumber',
    label: 'Telephone number',
    type: 'tel',
    required: true,
    placeholder: '1234567890',
    order: 4,
    minLength: 9,
    pattern: '^[0-9]+$'
  },
  {
    key: 'businessName',
    label: 'Business name',
    type: 'text',
    required: true,
    placeholder: 'Enter your business name',
    order: 3,
    minLength: 3,
    maxLength: 40
  },
  {
    key: 'deviceId',
    label: 'Device ID',
    type: 'number',
    required: true,
    placeholder: 'Enter your device ID',
    order: 6,
    min: 2,
    max: 15
  },
  {
    key: 'acceptTerms',
    label: 'Accept Terms and Conditions',
    type: 'checkbox',
    required: true,
    order: 7,
    mustEqual: true
  },
  {
    key: 'fiscalYear',
    label: 'Fiscal Year',
    type: 'date',
    placeholder: 'YYYY-MM-DD',
    order: 5
  }
]

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable('field_definitions', (table) => {
    table.integer('minLength').nullable()
    table.string('pattern').nullable()
    table.integer('min').nullable()
    table.integer('max').nullable()
    table.boolean('mustEqual').nullable()
  })

  return knex('field_definitions').insert(fields)
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  const keys = fields.map((f) => f.key)
  await knex('field_definitions').whereIn('key', keys).del()

  return knex.schema.alterTable('field_definitions', (table) => {
    table.dropColumn('minLength')
    table.dropColumn('pattern')
    table.dropColumn('min')
    table.dropColumn('max')
    table.dropColumn('mustEqual')
  })
}
