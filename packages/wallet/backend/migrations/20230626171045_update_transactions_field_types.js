/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('transactions', (table) => {
    // payment id is changed to string to support saving the id of a rapyd transaction
    table.string('paymentId').notNullable().alter()

    // fund/withdraw transactions are not linked to a payment pointer
    table.uuid('paymentPointerId').nullable().alter()

    // fund/withdraw transactions are linked to an account
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
