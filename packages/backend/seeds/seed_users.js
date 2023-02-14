/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  // Deletes ALL existing entries
  await knex('users').del()
  await knex('users').insert([
    {
      id: 1,
      username: 'admin',
      email: 'admin@admin.com',
      password: '$2a$10$p6Rzwj/YcoPBdh3MN4wKDOIaiPwBcZOvFlwDqH.6jZ3Qm.yX0Z0dq',
      firstName: 'admin',
      lastName: 'admin',
      rapydWalletId: '1',
      rapydContactId: '1'
    },
    {
      id: 2,
      username: 'user2',
      email: 'user2@admin.com',
      password: '$2a$10$p6Rzwj/YcoPBdh3MN4wKDOIaiPwBcZOvFlwDqH.6jZ3Qm.yX0Z0dq',
      firstName: 'user2',
      lastName: 'user2',
      rapydWalletId: '2',
      rapydContactId: '2'
    },
    {
      id: 3,
      username: 'user3',
      email: 'user3@admin.com',
      password: '$2a$10$p6Rzwj/YcoPBdh3MN4wKDOIaiPwBcZOvFlwDqH.6jZ3Qm.yX0Z0dq',
      firstName: 'user3',
      lastName: 'user3',
      rapydWalletId: '3',
      rapydContactId: '3'
    },
    {
      id: 4,
      username: 'user4',
      email: 'user4@admin.com',
      password: '$2a$10$p6Rzwj/YcoPBdh3MN4wKDOIaiPwBcZOvFlwDqH.6jZ3Qm.yX0Z0dq',
      firstName: 'user4',
      lastName: 'user4',
      rapydWalletId: '4',
      rapydContactId: '4'
    },
    {
      id: 5,
      username: 'user5',
      email: 'user5@admin.com',
      password: '$2a$10$p6Rzwj/YcoPBdh3MN4wKDOIaiPwBcZOvFlwDqH.6jZ3Qm.yX0Z0dq',
      firstName: 'user5',
      lastName: 'user5',
      rapydWalletId: '5',
      rapydContactId: '5'
    },
    {
      id: 6,
      username: 'user6',
      email: 'user6@admin.com',
      password: '$2a$10$p6Rzwj/YcoPBdh3MN4wKDOIaiPwBcZOvFlwDqH.6jZ3Qm.yX0Z0dq',
      firstName: 'user6',
      lastName: 'user6',
      rapydWalletId: '6',
      rapydContactId: '6'
    }
  ])
}
