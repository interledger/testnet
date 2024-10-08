/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('accounts', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table.string('name').notNullable()

    table.uuid('userId').notNullable()
    table.foreign('userId').references('users.id').onDelete('CASCADE')

    table.string('assetId').notNullable()
    table.specificType('assetCode', 'char(3)').notNullable() // ISO 4217 — Currency codes
    table.integer('assetScale').notNullable()
    table.bigint('balance').notNullable().defaultTo(0n)

    table.string('gateHubWalletId').notNullable()

    table.timestamp('createdAt').notNullable()
    table.timestamp('updatedAt').notNullable()
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('accounts')
}
