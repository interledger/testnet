const fields = [
  {
    key: 'contactEmail',
    label: 'Contact email',
    description: 'We use this to send onboarding confirmation.',
    type: 'email',
    required: true,
    placeholder: 'me@interledger.org',
    order: 2,
    format: 'email',
    maxLength: 255
  },
  { 
    id: '1acf7723-e1cd-44e7-a5db-3f614ce045ac',
    key: 'merchantCategoryCode',
    label: 'Merchant category',
    type: 'select',
    required: true,
    order: 1
  }
]

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('field_definitions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))

    table.string('key').notNullable()
    table.string('label').notNullable()
    table.string('description').nullable()
    table.enum('type', ['text', 'email', 'tel', 'number', 'select', 'checkbox', 'date']).notNullable()
    table.boolean('required').notNullable().defaultTo(false)
    table.string('placeholder').nullable()
    table.integer('order').notNullable()

    table.integer('maxLength').nullable()
    table.string('format').nullable()
    
    table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now())
    table.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now())
  })

  return knex('field_definitions').insert(fields)
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('field_definitions')
}