/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  return Promise.all([
    knex.schema.alterTable('users', function (table) {
      table.renameColumn('walletAddress', 'walletAddress')
    }),
    knex.schema.alterTable('payments', function (table) {
      table.renameColumn('walletAddress', 'walletAddress')
    })
  ])
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  return Promise.all([
    knex.schema.alterTable('users', function (table) {
      table.renameColumn('walletAddress', 'walletAddress')
    }),
    knex.schema.alterTable('payments', function (table) {
      table.renameColumn('walletAddress', 'walletAddress')
    })
  ])
}
