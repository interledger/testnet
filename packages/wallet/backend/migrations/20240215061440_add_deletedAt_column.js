/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('transactions', async (table) => {
    table.timestamp('deletedAt').nullable()
    await knex.raw(
      [
        `UPDATE transactions`,
        `SET "deletedAt" = "walletAddresses"."updatedAt"`,
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
    table.dropColumn('deletedAt')
  })
}
