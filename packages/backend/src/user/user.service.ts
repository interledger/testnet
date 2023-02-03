import { User } from './models/user';

// const knex = Knex(knexConfig)
// Model.knex(knex)

export async function getUserByUsername(username: string) {
  return User.query().findOne({ username })
}

export async function addUser(user: { username: string; password: string }) {
  return User.query().insert(user)
}
