/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('wmTransactions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table.uuid('paymentId').notNullable()

    table.uuid('wmPaymentPointerId').notNullable()
    table.foreign('wmPaymentPointerId').references('wmPaymentPointers.id')

    table.bigint('value').notNullable()

    table.enum('type', ['INCOMING', 'OUTGOING']).notNullable()
    table.enum('status', ['PENDING', 'COMPLETED', 'FAILED']).notNullable()

    table.timestamp('createdAt').notNullable()
    table.timestamp('updatedAt').notNullable()
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('wmTransactions')
}
