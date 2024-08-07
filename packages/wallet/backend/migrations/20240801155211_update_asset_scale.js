const Knex = require('knex')
const knexConfig = require('../knexfile')

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // Create a new Knex instance for the rafiki_backend database
  const rafikiKnex = Knex(knexConfig.rafiki_backend)

  try {
    await rafikiKnex('assets').update({ scale: 9 })
    await knex('accounts').update({ assetScale: 9 })
    await knex('walletAddresses').update({ assetScale: 9 })
  } finally {
    await rafikiKnex.destroy()
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  // Create a new Knex instance for the rafiki_backend database
  const rafikiKnex = Knex(knexConfig.rafiki_backend)

  try {
    await rafikiKnex('assets').update({ scale: 2 })
    await knex('accounts').update({ assetScale: 2 })
    await knex('walletAddresses').update({ assetScale: 2 })
  } finally {
    await rafikiKnex.destroy()
  }
}
