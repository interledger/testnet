/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('paymentPointers', (table) => {
    table.boolean('isWM').defaultTo(false)
    table.string('assetCode', 3)
    table.smallint('assetScale')
    table.decimal('balance', 10, 2).defaultTo(0)
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable('paymentPointers', (table) => {
    table.dropColumn('isWM')
    table.dropColumn('assetCode')
    table.dropColumn('assetScale')
    table.dropColumn('balance')
  })
}
