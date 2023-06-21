/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('paymentPointers', (table) => {
    table.string('publicKey')
    table.string('privateKey')
    table.string('jwk')
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable('paymentPointers', (table) => {
    table.dropColumn('publicKey')
    table.dropColumn('privateKey')
    table.dropColumn('jwk')
  })
}
