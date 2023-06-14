/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('paymentPointers', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table.string('url').notNullable()
    table.string('publicName').notNullable()

    table.uuid('accountId').notNullable()
    table.foreign('accountId').references('accounts.id').onDelete('CASCADE')
    table.boolean('active').notNullable().defaultTo(true)

    table.timestamp('createdAt').notNullable()
    table.timestamp('updatedAt').notNullable()
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('accounts')
}
