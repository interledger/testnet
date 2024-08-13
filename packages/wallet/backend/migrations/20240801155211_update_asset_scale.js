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
      const assets = await rafikiKnex('assets').distinct('code')

      for (const asset of assets) {
        const { code } = asset

        const existingAssetWithScale9 = await rafikiKnex('assets')
          .where({ code, scale: 9 })
          .first()

        if (existingAssetWithScale9) {
          await knex('accounts')
            .where({ assetCode: code, assetScale: 2 })
            .update({
              assetId: existingAssetWithScale9.id,
              assetScale: 9
            })
        } else {
          await rafikiKnex('assets')
            .where({ code, scale: 2 })
            .update({ scale: 9 })
        }
      }
    } finally {
      await rafikiKnex.destroy()
    }
  }

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

  await knex('walletAddresses').update({ assetScale: 9 })
  await knex('accounts').update({ assetScale: 9 })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  if (process.env.NODE_ENV !== 'test') {
    const rafikiKnex = Knex(knexConfig.rafiki_backend)

    try {
      const assets = await rafikiKnex('assets').distinct('code')

      for (const asset of assets) {
        const { code } = asset

        const existingAssetWithScale2 = await rafikiKnex('assets')
          .where({ code, scale: 2 })
          .first()

        if (existingAssetWithScale2) {
          await knex('accounts')
            .where({ assetCode: code, assetScale: 9 })
            .update({
              assetId: existingAssetWithScale2.id,
              assetScale: 2
            })
        } else {
          await rafikiKnex('assets')
            .where({ code, scale: 9 })
            .update({ scale: 2 })
        }
      }
    } finally {
      await rafikiKnex.destroy()
    }
  }

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

  await knex('walletAddresses').update({ assetScale: 2 })
  await knex('accounts').update({ assetScale: 2 })
}
