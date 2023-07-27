/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('users', async (table) => {
    table.boolean('isEmailVerified').defaultTo(false)
    table.string('verifyEmailToken').nullable()

    await knex('users').update({
      isEmailVerified: true
    })
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable('users', (table) => {
    table.dropColumn('isEmailVerified')
    table.dropColumn('verifyEmailToken')
  })
}
