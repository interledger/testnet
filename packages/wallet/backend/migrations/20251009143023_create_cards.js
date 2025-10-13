/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('cards', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))

    table.uuid('userId').notNullable()
    table.foreign('userId').references('users.id')

    table.uuid('accountId').notNullable()
    table.foreign('accountId').references('accounts.id')

    table.uuid('walletAddressId').notNullable()
    table.foreign('walletAddressId').references('walletAddresses.id')

    table.string('publicKey')
    table
      .enum('status', ['ORDERED', 'INACTIVE', 'ACTIVE', 'FROZEN', 'TERMINATED'])
      .notNullable()

    table.timestamp('createdAt').notNullable()
    table.timestamp('updatedAt').notNullable()
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('cards')
}
