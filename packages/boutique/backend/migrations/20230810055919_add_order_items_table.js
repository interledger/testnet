/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('orderItems', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table.uuid('orderId').notNullable()
    table.foreign('orderId').references('orders.id').onDelete('CASCADE')
    table.uuid('productId').notNullable()
    table.foreign('productId').references('products.id').onDelete('CASCADE')
    table.smallint('quantity').notNullable()
    table.float('price', 10, 2).notNullable()

    table.timestamp('createdAt').notNullable()
    table.timestamp('updatedAt').notNullable()
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('orderItems')
}
