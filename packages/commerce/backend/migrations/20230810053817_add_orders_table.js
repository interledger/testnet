/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('orders', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table.uuid('userId')
    table.foreign('userId').references('users.id').onDelete('CASCADE')
    table.uuid('quoteId').notNullable()
    table.float('total', 10, 2).notNullable
    table.enum('status', ['PROCESSING', 'COMPLETED', 'REJECTED']).notNullable()

    table.timestamp('createdAt').notNullable()
    table.timestamp('updatedAt').notNullable()
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('orders')
}
