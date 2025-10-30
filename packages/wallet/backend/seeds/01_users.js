const { randomUUID } = require('crypto')

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  // Deletes ALL existing entries
  await knex('cards').del()
  await knex('walletAddresses').del()
  await knex('accounts').del()
  await knex('users').del()
  //

  // Inserts seed entries
  const user = {
    id: randomUUID(),
    email: 'user1@ilp.com',
    password: '$2a$10$IpZBJ/bzRaO/ktc.BczCp.50YWP12Kcia6dC1u59N8lBWN83.XwD6', // password is 'password123'
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isEmailVerified: true,
    kycVerified: true,
    isPinSet: true,
    gateHubUserId: '123'
  }
  await knex('users').insert([user])

  const account = {
    id: randomUUID(),
    name: 'ILP Account',
    userId: user.id,
    assetId: randomUUID(),
    assetCode: 'EUR',
    assetScale: 2,
    balance: 100000n,
    isFunded: true,
    gateHubWalletId: '940617085',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  await knex('accounts').insert([account])

  const walletAddress = {
    id: randomUUID(),
    url: '$cozminu.com/ilp-wallet',
    publicName: 'Cozminu Wallet',
    accountId: account.id,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  await knex('walletAddresses').insert([walletAddress])

  const card = {
    id: randomUUID(),
    userId: user.id,
    accountId: account.id,
    walletAddressId: walletAddress.id,
    publicKey: `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEzX8mWRftQh7kWg0OIUBxeuKAMDGG
iqsKH/XpWHE7oJEmMe5l/sy1o1XDtBn5UH9/IUjY6blBAn+y936lciqYqQ==
-----END PUBLIC KEY-----
`,
    status: 'ACTIVE',
    atc: -1,
    pinTryCounter: 0,
    lastUnpredictableNumber: '00000000',
    pinTryLimit: 5,
    cmacKey: '92435687398457689374568934657863',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  await knex('cards').insert([card])
}
