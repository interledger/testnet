/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable('subscriptions', (table) => {
    table.float('amount', 10, 2).notNullable().defaultTo(0)
    table.string('currency', 3).notNullable().defaultTo('USD')
  })

  await knex.raw(`
    UPDATE "subscriptions" s
    SET "amount" = p."price",
        "currency" = 'USD'
    FROM "products" p
    WHERE s."productId" = p."id"
  `)
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable('subscriptions', (table) => {
    table.dropColumn('currency')
    table.dropColumn('amount')
  })
}
