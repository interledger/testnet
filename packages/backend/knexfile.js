module.exports = {
  development: {
    client: 'postgresql',
    // connection: 'postgres://postgres:password@postgres/testnet',
    connection: {
      host: 'postgres',
      database: 'testnet',
      user: 'postgres',
      password: 'password',
      port: 5433
    },
    pool: {
      min: 0,
      max: 10,
      acquireTimeoutMillis: 60000,
      idleTimeoutMillis: 600000
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  },

  testing: {
    client: 'postgresql',
    connection: {
      host: 'postgres',
      database: 'testnet',
      user: 'postgres',
      password: 'password',
      port: 5433
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  },

  production: {
    client: 'postgresql',
    connection: {
      host: 'postgres',
      database: 'testnet',
      user: 'postgres',
      password: 'password',
      port: 5433
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  }
}
