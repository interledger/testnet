/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('accounts', (table) => {
    table.uuid('id').notNullable().primary()
    table.string('rapyd_account_id').notNullable()
    table.string('user_id').notNullable()
    table.string('asset_code').notNullable()

    table.timestamps(false, true, true)
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('accounts')
}
