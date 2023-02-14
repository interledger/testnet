/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('paymentPointers', (table) => {
    table.uuid('id').notNullable().primary()
    table.uuid('accountId').notNullable()
    table.foreign('accountId').references('accounts.id')

    table.timestamps(false, true, true)
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('payment_pointers')
}
