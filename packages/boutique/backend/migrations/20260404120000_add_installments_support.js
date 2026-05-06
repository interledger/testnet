/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable('subscriptions', (table) => {
    table.integer('quantity').notNullable().defaultTo(1)
    table.smallint('currentPeriodNumber').notNullable().defaultTo(1)
    table.smallint('totalPayments').nullable()
  })

  await knex.schema.alterTable('orders', (table) => {
    table.smallint('paymentNumber').nullable()
    table.smallint('totalPayments').nullable()
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable('orders', (table) => {
    table.dropColumn('totalPayments')
    table.dropColumn('paymentNumber')
  })

  await knex.schema.alterTable('subscriptions', (table) => {
    table.dropColumn('totalPayments')
    table.dropColumn('currentPeriodNumber')
    table.dropColumn('quantity')
  })
}