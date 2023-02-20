exports.up = function (knex) {
  return knex.schema.createTable('refreshTokens', function (table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table.string('token').notNullable()
    table
      .uuid('userId')
      .unsigned()
      .notNullable()
      .references('users.id')
      .onDelete('CASCADE')
    table.datetime('expiresAt').notNullable()
    table.timestamps(true, true)
  })
}

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('refreshTokens')
}
