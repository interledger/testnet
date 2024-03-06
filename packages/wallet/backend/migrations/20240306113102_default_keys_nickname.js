/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  return knex.schema.alterTable('walletAddressKeys', async (table) => {
    await knex('walletAddressKeys')
      .update({ nickname: 'Testnet managed' })
      .whereNull('nickname')

    table.string('nickname').notNullable().alter()
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  return knex.schema.alterTable('walletAddressKeys', async (table) => {
    table.string('nickname').nullable().alter()
  })
}
