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
      first_name: 'admin',
      last_name: 'admin',
      rapyd_wallet_id: '1',
      rapyd_contact_id: '1'
    },
    {
      id: 2,
      username: 'user2',
      email: 'user2@admin.com',
      password: '$2a$10$p6Rzwj/YcoPBdh3MN4wKDOIaiPwBcZOvFlwDqH.6jZ3Qm.yX0Z0dq',
      first_name: 'user2',
      last_name: 'user2',
      rapyd_wallet_id: '2',
      rapyd_contact_id: '2'
    },
    {
      id: 3,
      username: 'user3',
      email: 'user3@admin.com',
      password: '$2a$10$p6Rzwj/YcoPBdh3MN4wKDOIaiPwBcZOvFlwDqH.6jZ3Qm.yX0Z0dq',
      first_name: 'user3',
      last_name: 'user3',
      rapyd_wallet_id: '3',
      rapyd_contact_id: '3'
    },
    {
      id: 4,
      username: 'user4',
      email: 'user4@admin.com',
      password: '$2a$10$p6Rzwj/YcoPBdh3MN4wKDOIaiPwBcZOvFlwDqH.6jZ3Qm.yX0Z0dq',
      first_name: 'user4',
      last_name: 'user4',
      rapyd_wallet_id: '4',
      rapyd_contact_id: '4'
    },
    {
      id: 5,
      username: 'user5',
      email: 'user5@admin.com',
      password: '$2a$10$p6Rzwj/YcoPBdh3MN4wKDOIaiPwBcZOvFlwDqH.6jZ3Qm.yX0Z0dq',
      first_name: 'user5',
      last_name: 'user5',
      rapyd_wallet_id: '5',
      rapyd_contact_id: '5'
    },
    {
      id: 6,
      username: 'user6',
      email: 'user6@admin.com',
      password: '$2a$10$p6Rzwj/YcoPBdh3MN4wKDOIaiPwBcZOvFlwDqH.6jZ3Qm.yX0Z0dq',
      first_name: 'user6',
      last_name: 'user6',
      rapyd_wallet_id: '6',
      rapyd_contact_id: '6'
    }
  ])
}
