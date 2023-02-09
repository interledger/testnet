/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.createTable('users', (table) => {
      table.increments('id').primary()
      table.string('username')
      table.string('email')
      table.string('password')
      table.string('last_name')
      table.string('first_name')
      table.string('rapyd_wallet_id')
      table.string('rapyd_contact_id')
      table.timestamps(false, true)
    })
  }
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  exports.down = function (knex) {
    return knex.schema.dropTable('users')
  }