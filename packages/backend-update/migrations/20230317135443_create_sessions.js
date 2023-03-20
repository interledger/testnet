/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('sessions', function (table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table.datetime('expiresAt').notNullable()

    table.uuid('userId').notNullable()
    table.foreign('userId').references('users.id').onDelete('CASCADE')

    table.timestamp('createdAt').notNullable()
    table.timestamp('updatedAt').notNullable()
  })
}
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('sessions')
}
