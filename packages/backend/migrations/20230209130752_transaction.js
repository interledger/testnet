/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('transactions', (table) => {
    table.uuid('id').notNullable().primary()
    table.uuid('payment_id').notNullable()
    table.string('description')

    table.uuid('payment_pointer_id').notNullable()
    table.foreign('payment_pointer_id').references('payment_pointers.id')

    table.string('asset_code').notNullable()
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
