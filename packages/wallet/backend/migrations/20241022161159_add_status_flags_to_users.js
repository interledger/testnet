/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.table('users', function (table) {
    table.boolean('isRejected').defaultTo(false)
    table.boolean('isDocumentUpdateRequired').defaultTo(false)
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.table('users', function (table) {
    table.dropColumn('isRejected')
    table.dropColumn('isDocumentUpdateRequired')
  })
}
