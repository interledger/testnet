/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable('products', (table) => {
    table
      .enum('productType', ['ONE_TIME', 'SUBSCRIPTION'])
      .notNullable()
      .defaultTo('ONE_TIME')
    table.enum('billingInterval', ['DAY', 'WEEK', 'MONTH', 'YEAR']).nullable()
    table.smallint('billingIntervalCount').nullable()
  })

  await knex.schema.createTable('subscriptions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table.uuid('productId').notNullable()
    table.foreign('productId').references('products.id').onDelete('RESTRICT')

    table.string('walletAddress').notNullable()

    table.string('continueUri').notNullable().defaultTo('')
    table.string('continueToken').notNullable().defaultTo('')
    table.string('interactNonce').notNullable().defaultTo('')
    table.string('clientNonce').notNullable().defaultTo('')

    table.string('accessToken').nullable()
    table.string('manageUrl').nullable()

    table
      .enum('status', ['PENDING', 'ACTIVE', 'PAST_DUE', 'CANCELED'])
      .notNullable()
      .defaultTo('PENDING')

    table.timestamp('nextBillingAt').nullable()
    table.smallint('retryCount').notNullable().defaultTo(0)

    table.uuid('latestOrderId').nullable()
    table.foreign('latestOrderId').references('orders.id').onDelete('SET NULL')

    table.timestamp('canceledAt').nullable()
    table.timestamp('createdAt').notNullable()
    table.timestamp('updatedAt').notNullable()
  })

  await knex('products').where({ slug: 'knowledge' }).update({
    productType: 'SUBSCRIPTION',
    billingInterval: 'MONTH',
    billingIntervalCount: 1
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTable('subscriptions')

  await knex.schema.alterTable('products', (table) => {
    table.dropColumn('billingIntervalCount')
    table.dropColumn('billingInterval')
    table.dropColumn('productType')
  })
}
