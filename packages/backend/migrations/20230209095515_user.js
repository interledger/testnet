/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('users', (table) => {
    table.uuid('id').notNullable().primary()
    table.string('email').notNullable()
    table.string('password').notNullable()
    table.string('lastName').notNullable()
    table.string('firstName').notNullable()
    table.string('rapydWalletId').notNullable()
    table.string('rapydContactId').notNullable()

    table.timestamps(false, true, true)
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('users')
}
