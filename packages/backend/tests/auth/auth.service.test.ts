import { NextFunction, Request, Response } from 'express'
import { signup } from '../../src/auth/auth.service'

import {
  ContainerInstance,
  startContainer,
  stopContainer,
  TEST_TIMEOUTS
} from '../test-setup'

import { BadRequestException } from '../../src/shared/models/errors/BadRequestException'

describe('AuthService', () => {
  jest.setTimeout(TEST_TIMEOUTS)
  let containerInstance: ContainerInstance

  beforeAll(async () => {
    containerInstance = await startContainer()
  })

  afterAll(async () => await stopContainer(containerInstance))

  describe('signup', () => {
    it('should return a token and refreshToken when valid credentials are supplied.', async () => {
      const mockReq = {
        body: {
          email: 'test@test.com',
          password: 'Admin1234',
          confirmPassword: 'Admin1234'
        }
      } as Request
      const mockRes = {
        json: jest.fn(),
        status: jest.fn()
      }
      mockRes.status.mockImplementation(() => mockRes)
      await signup(
        mockReq,
        mockRes as unknown as Response,
        jest.fn() as NextFunction
      )

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Success'
      })
    })

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
  })
})
