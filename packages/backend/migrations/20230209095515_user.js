/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('users', (table) => {
    table.uuid('id').notNullable().primary()
    table.string('email').notNullable()
    table.string('password').notNullable()
    table.string('last_name').notNullable()
    table.string('first_name').notNullable()
    table.string('rapyd_wallet_id').notNullable()
    table.string('rapyd_contact_id').notNullable()
    
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
