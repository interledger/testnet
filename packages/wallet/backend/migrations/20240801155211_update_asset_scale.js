const Knex = require('knex')
const knexConfig = require('../knexfile')

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  if (process.env.NODE_ENV !== 'test') {
    const rafikiKnex = Knex(knexConfig.rafiki_backend)

    try {
      await rafikiKnex('assets').update({ scale: 9 })
    } finally {
      await rafikiKnex.destroy()
    }
  }

  await knex('accounts').update({ assetScale: 9 })
  await knex('walletAddresses').update({ assetScale: 9 })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  if (process.env.NODE_ENV !== 'test') {
    const rafikiKnex = Knex(knexConfig.rafiki_backend)

    try {
      await rafikiKnex('assets').update({ scale: 2 })
    } finally {
      await rafikiKnex.destroy()
    }
  }
  await knex('accounts').update({ assetScale: 2 })
  await knex('walletAddresses').update({ assetScale: 2 })
}
