/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('transactions', async (table) => {
    table.timestamp('expiresAt')
    await knex.raw(
      [
        `ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "transactions_status_check";`,
        `ALTER TABLE "transactions" ADD CONSTRAINT "transactions_status_check" CHECK ("status" = ANY (ARRAY['PENDING'::text, 'COMPLETED'::text, 'REJECTED'::text, 'EXPIRED'::text]))`
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
    table.dropColumn('expiresAt')
    await knex.raw(
      [
        `ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "transactions_status_check";`,
        `ALTER TABLE "transactions" ADD CONSTRAINT "transactions_status_check" CHECK ("status" = ANY (ARRAY['PENDING'::text, 'COMPLETED'::text, 'REJECTED'::text]))`
      ].join('\n')
    )
  })
}
