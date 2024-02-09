/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  return knex.schema.createTable('walletAddressKeys', (table) => {
    table.string('id').primary()
    table.string('rafikiId').notNullable()
    table.string('publicKey').notNullable()
    table.string('name')

    table.uuid('walletAddressId').notNullable()
    table
      .foreign('walletAddressId')
      .references('walletAddresses.id')
      .onDelete('CASCADE')

    table.timestamp('createdAt').notNullable()
    table.timestamp('updatedAt').notNullable()
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  return knex.schema.dropTableIfExists('walletAddressKeys')
}
