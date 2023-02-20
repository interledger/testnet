/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

const { faker } = require('@faker-js/faker')

exports.seed = async function (knex) {
  // Deletes ALL existing entries
  await knex('users').del()

  const users = [
    [
      {
        id: faker.datatype.uuid(),
        email: 'admin@admin.com',
        password:
          '$2a$10$p6Rzwj/YcoPBdh3MN4wKDOIaiPwBcZOvFlwDqH.6jZ3Qm.yX0Z0dq',
        firstName: 'admin',
        lastName: 'admin',
        rapydWalletId: '1',
        rapydContactId: '1'
      },
      {
        id: faker.datatype.uuid(),
        email: faker.internet.email(),
        password:
          '$2a$10$p6Rzwj/YcoPBdh3MN4wKDOIaiPwBcZOvFlwDqH.6jZ3Qm.yX0Z0dq',
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        rapydWalletId: '2',
        rapydContactId: '2'
      },
      {
        id: faker.datatype.uuid(),
        email: 'user3@admin.com',
        password:
          '$2a$10$p6Rzwj/YcoPBdh3MN4wKDOIaiPwBcZOvFlwDqH.6jZ3Qm.yX0Z0dq',
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        rapydWalletId: '3',
        rapydContactId: '3'
      },
      {
        id: faker.datatype.uuid(),
        email: 'user4@admin.com',
        password:
          '$2a$10$p6Rzwj/YcoPBdh3MN4wKDOIaiPwBcZOvFlwDqH.6jZ3Qm.yX0Z0dq',
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        rapydWalletId: '4',
        rapydContactId: '4'
      },
      {
        id: faker.datatype.uuid(),
        email: 'user5@admin.com',
        password:
          '$2a$10$p6Rzwj/YcoPBdh3MN4wKDOIaiPwBcZOvFlwDqH.6jZ3Qm.yX0Z0dq',
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        rapydWalletId: '5',
        rapydContactId: '5'
      },
      {
        id: faker.datatype.uuid(),
        email: 'user6@admin.com',
        password:
          '$2a$10$p6Rzwj/YcoPBdh3MN4wKDOIaiPwBcZOvFlwDqH.6jZ3Qm.yX0Z0dq',
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        rapydWalletId: '6',
        rapydContactId: '6'
      }
    ]
  ]
  console.log(users)
  await knex('users').insert(users)
}
