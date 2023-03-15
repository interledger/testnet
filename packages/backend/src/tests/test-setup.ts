// import knex, { Knex } from 'knex'
// import { Model } from 'objection'
// import path from 'path'
// import { PostgreSqlContainer, StartedPostgreSqlContainer } from 'testcontainers'

// export const TEST_TIMEOUTS = 60000

// export interface ContainerInstance {
//   container: StartedPostgreSqlContainer
//   pg: Knex
// }

// export async function startContainer(): Promise<ContainerInstance> {
//   try {
//     const container = await new PostgreSqlContainer('postgres:15')
//       .withDatabase('testnet')
//       .withPassword('password')
//       .withUser('postgres')
//       .start()

//     const pg = knex({
//       client: 'pg',
//       connection: {
//         user: container.getUsername(),
//         host: container.getHost(),
//         database: container.getDatabase(),
//         port: container.getPort(),
//         password: container.getPassword(),
//         ssl: false
//       },
//       pool: { min: 3, max: 10 },
//       migrations: { directory: path.join(__dirname, '../migrations') },
//       debug: false
//     })

//     await pg.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

//     await pg.migrate.latest({
//       directory: __dirname + '/../migrations'
//     })

//     Model.knex(pg)

//     return { container, pg }
//   } catch (e) {
//     console.log(e)
//     throw e
//   }
// }

// export async function stopContainer(
//   instance: ContainerInstance
// ): Promise<void> {
//   await instance.container.stop()
//   await instance.pg.destroy()
// }
