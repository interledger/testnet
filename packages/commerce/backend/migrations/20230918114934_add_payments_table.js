/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('payments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table.uuid('orderId').notNullable()
    table.foreign('orderId').references('orders.id').onDelete('CASCADE')
    table.string('paymentPointer').notNullable()
    table.string('incomingPaymentUrl').notNullable()
    table.string('quoteId').notNullable()
    table.string('continueUri').notNullable()
    table.string('continueToken').notNullable()
    table.string('interactUrl').notNullable()
    table.string('interactNonce').notNullable()
    table.string('clientNonce').notNullable()

    table.timestamp('createdAt').notNullable()
    table.timestamp('updatedAt').notNullable()
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('payments')
}
