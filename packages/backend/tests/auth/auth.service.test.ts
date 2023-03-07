import { NextFunction, Request, Response } from 'express'
import { login } from '../../src/auth/auth.service'
// import { User } from '../../src/user/models/user'

import {
  ContainerInstance,
  startContainer,
  stopContainer,
  TEST_TIMEOUTS
} from '../test-setup'

// import { Model, QueryBuilder } from 'objection'

// const u = {
//   id: 1,
//   email: '1',
//   password: '1',
//   refreshTokens: [{ id: 1, token: '1', userId: 1, expiresAt: new Date() }]
// } as unknown as User

// console.log(u)
// console.log(Model)

// jest.mock('objection', () => {
//   return jest.fn().mockImplementation(() => {
//     return {
//       findOne: jest.fn().mockImplementation(() => Promise.resolve([u])),
//       select: jest.fn().mockImplementation(() => Promise.resolve(u)),
//       withGraphFetched: jest.fn().mockImplementation(() => Promise.resolve(u))
//     }
//   })
// })

// jest.mock('../../src/user/models/user')
// jest.mock('../../src/auth/models/refreshToken')

// jest.mock('objection')
// jest.mock('../../src/auth/models/refreshToken', () => {
//   return jest.fn().mockImplementation(() => {
//     return { id: 1, token: '1', userId: 1, expiresAt: new Date() }
//   })
// })

// const uz = jest.mock('../../src/user/models/user', () => {
//   return jest.fn().mockImplementation(() => {
//     return {
//       verifyPassword: jest.fn().mockImplementation(() => Promise.resolve(true)),
//       query: jest.fn().mockImplementation(() => new QueryBuilder<any>())
//     }
//   })
// })

// console.log(uz)

describe('AuthService', () => {
  jest.setTimeout(TEST_TIMEOUTS)
  let containerInstance: ContainerInstance

  beforeAll(async () => {
    containerInstance = await startContainer()
  })

  afterAll(async () => await stopContainer(containerInstance))

  it('logins', async () => {
    const x = true

    expect(x).toBe(true)
    const mockReq = {
      body: {
        email: 'test@test.com',
        password: 'password'
      }
    } as unknown as Request

    const mockRes = {
      json: jest.fn()
    } as unknown as Response

    const nextFn = jest.fn() as NextFunction

    await login(mockReq, mockRes, nextFn)
  })

  // describe('login', () => {
  //   it('should return a token and refreshToken when valid credentials are supplied', async () => {
  //     const mockReq = {
  //       body: {
  //         email: 'test@test.com',
  //         password: 'password'
  //       }
  //     } as Request
  //     const mockRes = {
  //       json: jest.fn()
  //     } as unknown as Response

  //     jest
  //       .spyOn(User, 'query')
  //       .mockImplementation(() => new QueryBuilder().resolve(u))

  //     const nextFn = jest.fn() as NextFunction
  //     await login(mockReq, mockRes, nextFn)

  //     expect(mockRes.json).toHaveBeenCalledWith(
  //       expect.objectContaining({
  //         token: expect.any(String),
  //         refreshToken: expect.any(String)
  //       })
  //     )
  //   })

  //   it('should throw an UnauthorisedException if the credentials are incorrect', async () => {
  //     const mockReq = {
  //       body: {
  //         email: 'test@test.com',
  //         password: 'wrongpassword'
  //       }
  //     } as Request
  //     const mockRes = {
  //       json: jest.fn(),
  //       status: jest.fn(() => ({ json: jest.fn() }))
  //     } as unknown as Response
  //     await expect(login(mockReq, mockRes)).rejects.toThrow(
  //       UnauthorisedException
  //     )
  //   })
  // })

  // describe('signup', () => {
  //   it('should return a token and refreshToken when valid credentials are supplied', async () => {
  //     const mockReq = {
  //       body: {
  //         email: 'test@test.com',
  //         password: 'password'
  //       }
  //     } as Request
  //     const mockRes = {
  //       json: jest.fn()
  //     } as unknown as Response
  //     await signup(mockReq, mockRes)

  //     expect(mockRes.json).toHaveBeenCalledWith(
  //       expect.objectContaining({
  //         token: expect.any(String),
  //         refreshToken: expect.any(String)
  //       })
  //     )
  //   })

  //   it('should throw a BadRequestException if the email already exists', async () => {
  //     const mockReq = {
  //       body: {
  //         email: 'test@test.com',
  //         password: 'password'
  //       }
  //     } as Request
  //     const mockRes = {
  //       json: jest.fn(),
  //       status: jest.fn(() => ({ json: jest.fn() }))
  //     } as unknown as Response
  //     await signup(mockReq, mockRes)

  //     const mockReq2 = {
  //       body: {
  //         email: 'test@test.com',
  //         password: 'password'
  //       }
  //     } as Request
  //     await expect(signup(mockReq2, mockRes)).rejects.toThrow(
  //       BadRequestException
  //     )
  //   })
})
