/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('orders', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table.uuid('userId')
    table.foreign('userId').references('users.id').onDelete('CASCADE')
    table.float('total', 10, 2).defaultTo(0.0)
    table
      .enum('status', ['PROCESSING', 'FAILED', 'COMPLETED', 'REJECTED'])
      .notNullable()
      .defaultTo('PROCESSING')

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
