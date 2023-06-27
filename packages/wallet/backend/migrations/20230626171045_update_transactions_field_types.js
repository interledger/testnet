/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('transactions', (table) => {
    // payment id is changed to string to support saving a link to rapyd transaction
    table.string('paymentId').notNullable().alter()

    // fund/withdraw transactions does not have payment pointer
    table.uuid('paymentPointerId').nullable().alter()

    // fund/withdraw transactions will be linked to an account
    table.uuid('accountId').nullable()
    table.foreign('accountId').references('accounts.id')
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable('transactions', (table) => {
    table.uuid('paymentId').notNullable().alter()
    table.uuid('paymentPointerId').notNullable().alter()
    table.dropColumn('accountId')
  })
}
