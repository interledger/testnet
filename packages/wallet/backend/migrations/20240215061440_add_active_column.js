/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('transactions', async (table) => {
    table.boolean('active').notNullable().defaultTo(true)
    await knex.raw([`UPDATE transactions`, `SET active = true`].join('\n'))
    await knex.raw(
      [
        `UPDATE transactions`,
        `SET active = false`,
        `FROM "walletAddresses"`,
        `WHERE transactions."walletAddressId" = "walletAddresses".id AND "walletAddresses".active = false`
      ].join('\n')
    )
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable('transactions', async (table) => {
    table.dropColumn('debt')
  })
}
