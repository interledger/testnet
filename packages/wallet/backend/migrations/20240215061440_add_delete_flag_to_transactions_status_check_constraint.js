/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('transactions', async (table) => {
    await knex.raw(
      [
        `ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "transactions_status_check";`,
        `ALTER TABLE "transactions" ADD CONSTRAINT "transactions_status_check" CHECK ("status" = ANY (ARRAY['PENDING'::text, 'COMPLETED'::text, 'REJECTED'::text, 'EXPIRED'::text, 'DELETED'::text]))`
      ].join('\n')
    )

    await knex.raw(
      [
        `UPDATE transactions`,
        `SET status = 'DELETED'`,
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
    await knex.raw(
      [
        `ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "transactions_status_check";`,
        `ALTER TABLE "transactions" ADD CONSTRAINT "transactions_status_check" CHECK ("status" = ANY (ARRAY['PENDING'::text, 'COMPLETED'::text, 'REJECTED'::text, , 'EXPIRED'::text]))`
      ].join('\n')
    )
  })
}
