exports.up = function (knex) {
  return knex.schema.table('walletAddresses', function (table) {
    table.string('cardId').unique().nullable()
  })
}

exports.down = function (knex) {
  return knex.schema.table('walletAddresses', function (table) {
    table.dropColumn('cardId')
  })
}
