const Knex = require('knex')
const knexConfig = require('../knexfile')

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const walletAddresses = await knex('walletAddresses').select(
    'id',
    'accountId'
  )
  for (const walletAddress of walletAddresses) {
    const account = await knex('accounts')
      .where('id', walletAddress.accountId)
      .first()
    if (account) {
      await knex('walletAddresses')
        .where('id', walletAddress.id)
        .update({ assetCode: account.assetCode })
    }
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  const walletAddresses = await knex('walletAddresses').select(
    'id',
    'accountId'
  )
  for (const walletAddress of walletAddresses) {
    const account = await knex('accounts')
      .where('id', walletAddress.accountId)
      .first()
    if (account) {
      await knex('walletAddresses')
        .where('id', walletAddress.id)
        .update({ assetCode: null })
    }
  }
}
