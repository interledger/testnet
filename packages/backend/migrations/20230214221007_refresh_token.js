exports.up = function (knex) {
  return knex.schema.createTable('refresh_tokens', function (table) {
    table.increments('id').primary()
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
  return knex.schema.dropTableIfExists('refresh_tokens')
}
