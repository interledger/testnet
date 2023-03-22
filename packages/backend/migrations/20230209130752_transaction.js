/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('transactions', (table) => {
    table.uuid('id').notNullable().primary().defaultTo(knex.raw('gen_random_uuid()'))
    table.string('paymentId').notNullable()
    table.string('description')

    table.uuid('paymentPointerId').notNullable()
    table.foreign('paymentPointerId').references('paymentPointers.id')

    table.string('assetCode').notNullable()
    table.float('value').notNullable()
    table.enum('type', ['INCOMING', 'OUTGOING']).notNullable()
    table.enum('status', ['PENDING', 'COMPLETED', 'REJECTED']).notNullable()

    table.timestamps(false, true, true)
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('transactions')
}
