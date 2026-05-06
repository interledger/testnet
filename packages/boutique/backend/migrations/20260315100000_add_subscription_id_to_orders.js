/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable('orders', (table) => {
    table.uuid('subscriptionId').nullable()
    table
      .foreign('subscriptionId')
      .references('subscriptions.id')
      .onDelete('SET NULL')
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable('orders', (table) => {
    table.dropForeign('subscriptionId')
    table.dropColumn('subscriptionId')
  })
}
