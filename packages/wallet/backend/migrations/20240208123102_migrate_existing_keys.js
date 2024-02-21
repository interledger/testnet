/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  return knex.schema.alterTable('walletAddresses', async (table) => {
    const walletAddresses = await knex
      .select('id', 'keyIds')
      .from('walletAddresses')
      .whereNotNull('keyIds')

    await Promise.all(
      walletAddresses.map(async (walletAddress) => {
        const key = {
          id: walletAddress.keyIds.id,
          walletAddressId: walletAddress.id,
          rafikiId: walletAddress.keyIds.rafikiId,
          publicKey: walletAddress.keyIds.publicKey,
          updatedAt: walletAddress.keyIds.createdOn,
          createdAt: walletAddress.keyIds.createdOn
        }
        await knex('walletAddressKeys').insert(key)
      })
    )

    await table.dropColumn('keyIds')
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  return knex.schema.alterTable('walletAddresses', async (table) => {
    table.jsonb('keyIds')
    const walletAddressKeys = await knex.select().from('walletAddressKeys')

    await Promise.all(
      walletAddressKeys.map(async (walletAddressKey) => {
        const keyIds = {
          id: walletAddressKey.id,
          rafikiId: walletAddressKey.rafikiId,
          publicKey: walletAddressKey.publicKey,
          createdOn: walletAddressKey.createdAt
        }

        await knex('walletAddress')
          .where('id', '=', walletAddressKey.walletAddressId)
          .update({
            keyIds
          })
      })
    )

    await knex('walletAddressKeys').truncate()
  })
}
