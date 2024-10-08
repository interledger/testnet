/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.renameTable('paymentPointers', 'walletAddresses')
  return Promise.all([
    knex.raw(
      'ALTER INDEX "paymentPointers_pkey" RENAME TO "walletAddresses_pkey"'
    ),
    knex.schema.alterTable('transactions', function (table) {
      table.dropForeign(['paymentPointerId'])
      table.renameColumn('paymentPointerId', 'walletAddressId')
      table.foreign('walletAddressId').references('walletAddresses.id')
    })
  ])
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.renameTable('walletAddresses', 'paymentPointers')
  return Promise.all([
    knex.raw(
      'ALTER INDEX "walletAddresses_pkey" RENAME TO "paymentPointers_pkey"'
    ),
    knex.schema.alterTable('transactions', function (table) {
      table.dropForeign(['walletAddressId'])
      table.renameColumn('walletAddressId', 'paymentPointerId')
      table.foreign('paymentPointerId').references('paymentPointers.id')
    })
  ])
}
