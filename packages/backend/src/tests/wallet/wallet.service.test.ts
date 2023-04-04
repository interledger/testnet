import { NextFunction, Request, Response } from 'express'
import { Model } from 'objection'
import { BadRequestException } from '../../shared/models/errors/BadRequestException'
import { createWallet, verifyIdentity } from '../../wallet/wallet.service'
import { createWalletRequest, verifyIdentityRequest } from './wallet.mock'
import * as walletApis from '../../rapyd/wallet/request'
// import { NotFoundException } from '../../shared/models/errors/NotFoundException'

describe('WalletService', () => {
  beforeAll(async () => {
    Model.knex(global.__TESTING_KNEX__)
  })

  describe('createWallet', () => {
    it(`should throw a BadRequestException if schema doesn't match with walletSchema`, async () => {
      const mockReq = {
        user: {
          id: 1,
          email: 'test@test.com'
        } as unknown,
        body: {
          ...createWalletRequest,
          zip: undefined
        }
      } as Request

      const mockRes = {
        json: jest.fn(),
        status: jest.fn()
      }
      const nextFn = jest.fn()

      mockRes.status.mockImplementation(() => mockRes)
      await createWallet(
        mockReq,
        mockRes as unknown as Response,
        nextFn as NextFunction
      )

      expect(nextFn).toHaveBeenCalledWith(
        new BadRequestException('Invalid input', { zip: 'Required' })
      )
    })

    it(`should return status 500 if there was errors creating a wallet on rapyd`, async () => {
      const mockReq = {
        user: {
          id: 1,
          email: 'test@test.com'
        } as unknown,
        body: {
          ...createWalletRequest
        }
      } as Request

      const mockRes = {
        json: jest.fn(),
        status: jest.fn()
      }

      const mockedCreateWallet = jest.spyOn(walletApis, 'createRapydWallet')
      mockedCreateWallet.mockReturnValueOnce(
        Promise.resolve({
          status: {
            status: 500
          }
        })
      )
      const nextFn = jest.fn()

      mockRes.status.mockImplementation(() => mockRes)
      await createWallet(
        mockReq,
        mockRes as unknown as Response,
        nextFn as NextFunction
      )
      expect(mockRes.status).toHaveBeenCalledWith(500)
    })
    /*
    it(`should throw NotFoundException if there was no users found with provided user id in request header`, async () => {
      const mockReq = {
        user: {
          id: 1,
          email: 'test@test.com'
        } as unknown,
        body: {
          ...createWalletRequest
        }
      } as Request

      const mockRes = {
        json: jest.fn(),
        status: jest.fn()
      }
      const nextFn = jest.fn()

      const mockedCreateWallet = jest.spyOn(walletApis, 'createRapydWallet')
      mockedCreateWallet.mockReturnValueOnce(
        Promise.resolve({
          status: {
            status: 'SUCCESS'
          },
          data: mockRapydWallet
        })
      )
      mockRes.status.mockImplementation(() => mockRes)
      await createWallet(mockReq, mockRes as unknown as Response, nextFn as NextFunction)
      expect(mockRes.status).toHaveBeenCalledWith(500)
    })*/
  })

  describe('verifyIdentity', () => {
    it(`should throw a BadRequestException if schema doesn't match with kycSchema`, async () => {
      const mockReq = {
        user: {
          id: 1,
          email: 'test@test.com'
        } as unknown,
        body: {
          ...verifyIdentityRequest,
          faceImage: undefined
        }
      } as Request

      const mockRes = {
        json: jest.fn(),
        status: jest.fn()
      }
      const nextFn = jest.fn()

      mockRes.status.mockImplementation(() => mockRes)
      await verifyIdentity(
        mockReq,
        mockRes as unknown as Response,
        nextFn as NextFunction
      )

      expect(nextFn).toHaveBeenCalledWith(
        new BadRequestException('Invalid input', { faceImage: 'Required' })
      )
    })
    /*
    it(`should throw a NotFoundException if there's no user available in the database`, async () => {
      const mockReq = {
        user: {
          id: 3,
          email: 'test@test.com'
        } as unknown,
        body: {
          ...verifyIdentityRequest
        }
      } as Request

      const mockRes = {
        json: jest.fn(),
        status: jest.fn()
      }
      const nextFn = jest.fn()

      mockRes.status.mockImplementation(() => mockRes)
      await verifyIdentity(mockReq, mockRes as unknown as Response, nextFn as NextFunction)
      
      expect(nextFn).toHaveBeenCalledWith(
        new NotFoundException()
      )
    })*/
  })
})
