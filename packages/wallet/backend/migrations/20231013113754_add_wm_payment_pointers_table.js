/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('wmPaymentPointers', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table.string('url').notNullable()
    table.string('publicName').notNullable()

    table.uuid('accountId').notNullable()
    table.foreign('accountId').references('accounts.id').onDelete('CASCADE')
    table.boolean('active').notNullable().defaultTo(true)
    table.string('assetCode', 3).notNullable()
    table.smallint('assetScale').notNullable()
    table.decimal('balance', 10, 2).notNullable().defaultTo(0.0)
    table.jsonb('keyIds')

    table.timestamp('createdAt').notNullable()
    table.timestamp('updatedAt').notNullable()
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('wmPaymentPointers')
}
