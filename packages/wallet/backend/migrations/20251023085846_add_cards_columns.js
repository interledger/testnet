/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.table('cards', function (table) {
    table.integer('atc').defaultTo(-1)
    table.string('pin')
    table.integer('pinTryCounter').defaultTo(0)
    table.string('lastUnpredictableNumber').defaultTo('00000000')
    table.integer('pinTryLimit').defaultTo(5)
    table.integer('amountThresholdForPin').nullable()
    table.string('cmacKey').nullable()
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.table('cards', function (table) {
    table.dropColumn('atc')
    table.dropColumn('pin')
    table.dropColumn('pinTryCounter')
    table.dropColumn('lastUnpredictableNumber')
    table.dropColumn('pinTryLimit')
    table.dropColumn('amountThresholdForPin')
    table.dropColumn('cmacKey')
  })
}
