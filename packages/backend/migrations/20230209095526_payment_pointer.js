/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('payment_pointers', (table) => {
    table.uuid('id').notNullable().primary()
    table.uuid('account_id').notNullable()
    table.foreign('account_id').references('accounts.id')

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
