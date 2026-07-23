const options = [
  {
    fieldId: '1acf7723-e1cd-44e7-a5db-3f614ce045ac',
    value: '5411',
    label: 'Grocery stores / supermarkets'
  },
  {
    fieldId: '1acf7723-e1cd-44e7-a5db-3f614ce045ac',
    value: '5812',
    label: 'Eating places / restaurants'
  },
  {
    fieldId: '1acf7723-e1cd-44e7-a5db-3f614ce045ac',
    value: '5999',
    label: 'Miscellaneous retail'
  }
]
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('options', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))

    table.uuid('fieldId').notNullable()
    table.foreign('fieldId').references('id').inTable('field_definitions')
    table.string('value').notNullable()
    table.string('label').notNullable()

    table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now())
    table.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now())
  })

  return knex('options').insert(options)
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('options')
}
