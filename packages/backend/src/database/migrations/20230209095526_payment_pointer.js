/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.createTable('payment_pointers', (table) => {
      table.string('payment_pointer_id').primary()
      table.integer('account_id')
      
      table.timestamps(false, true)
    })
  }
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  exports.down = function (knex) {
    return knex.schema.dropTable('payment_pointers')
  }