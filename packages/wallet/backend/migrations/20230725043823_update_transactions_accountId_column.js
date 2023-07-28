/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('transactions', async (table) => {
    const transactions = await knex
      .select('id', 'paymentPointerId')
      .from('transactions')
      .whereNull('accountId')

    transactions.forEach(async (trx) => {
      const paymentPointer = await knex
        .select('accountId')
        .from('paymentPointers')
        .where('id', '=', trx.paymentPointerId)

      await knex('transactions').where('id', '=', trx.id).update({
        accountId: paymentPointer[0].accountId
      })
    })

    table.uuid('accountId').notNullable().alter()
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable('transactions', (table) => {
    table.uuid('accountId').nullable().alter()
  })
}
