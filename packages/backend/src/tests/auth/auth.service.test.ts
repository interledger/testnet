import { NextFunction, Request, Response } from 'express'
import { Model } from 'objection'

import { BadRequestException } from '../../shared/models/errors/BadRequestException'
import { signup } from '../../auth/auth.service'

describe('AuthService', () => {
  beforeAll(async () => {
    Model.knex(global.__TESTING_KNEX__)
  })

  describe('signup', () => {
    // it('should return a token and refreshToken when valid credentials are supplied.', async () => {
    //   const mockReq = {
    //     body: {
    //       email: 'test@test.com',
    //       password: 'Admin1234',
    //       confirmPassword: 'Admin1234'
    //     }
    //   } as Request
    //   const mockRes = {
    //     json: jest.fn(),
    //     status: jest.fn()
    //   }
    //   mockRes.status.mockImplementation(() => mockRes)
    //   await signup(
    //     mockReq,
    //     mockRes as unknown as Response,
    //     jest.fn() as NextFunction
    //   )

    //   expect(mockRes.json).toHaveBeenCalledWith({
    //     success: true,
    //     message: 'Success'
    //   })
    // })

    it('should throw a BadRequestException if passwordConfirmation is invalid ', async () => {
      const mockReq = {
        body: {
          email: 'test@test.com',
          password: 'Admin1234',
          confirmPassword: 'wrongPass'
        }
      } as Request
      const mockRes = {
        json: jest.fn(),
        status: jest.fn()
      }
      const nextFn = jest.fn()
      mockRes.status.mockImplementation(() => mockRes)
      await signup(
        mockReq,
        mockRes as unknown as Response,
        nextFn as NextFunction
      )
      expect(nextFn).toHaveBeenCalledWith(
        new BadRequestException('Passwords do not match')
      )
    })

    it('should throw a BadRequestException if input validation failed ', async () => {
      const mockReq = {
        body: {
          emailz: 'test@test.com',
          password: 'Admin1234',
          confirmPassword: 'wrongPass'
        }
      } as Request
      const mockRes = {
        json: jest.fn(),
        status: jest.fn()
      }
      const nextFn = jest.fn()
      mockRes.status.mockImplementation(() => mockRes)
      await signup(
        mockReq,
        mockRes as unknown as Response,
        nextFn as NextFunction
      )
      expect(nextFn).toHaveBeenCalledWith(
        new BadRequestException('Invalid input', { email: 'Required' })
      )
    })
  })
})
