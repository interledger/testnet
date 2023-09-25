import { User } from '@/user/model'
import { createRequest, createResponse } from 'node-mocks-http'
import { mockedListAssets } from './mocks'
import { createContainer } from '@/createContainer'
import { env } from '@/config/env'

export const createUser = (args: Partial<User>) => {
  return User.query().insertAndFetch(args)
}

export const createMockAccount = async () => {
  const req = createRequest()
  const res = createResponse()
  const accountName = 'mocked-USD'
  const bindings = createContainer(env)
  const next = jest.fn()

  req.body = {
    name: accountName,
    assetId: mockedListAssets[0].id
  }
  const accountController = await bindings.resolve('accountController')

  await accountController.createAccount(req, res, next)
  const createdAccount = res._getJSONData().data

  return createdAccount
}
