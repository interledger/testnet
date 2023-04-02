import { Request, Response } from 'express'
import { Model } from 'objection'
import { createWallet } from '../../wallet/wallet.service'
import { createWalletRequest } from './wallet.mock'
import * as walletApis from '../../rapyd/wallet/request'

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

      mockRes.status.mockImplementation(() => mockRes)
      await createWallet(mockReq, mockRes as unknown as Response)
      expect(mockRes.status).toHaveBeenCalledWith(500)
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
      mockRes.status.mockImplementation(() => mockRes)
      await createWallet(mockReq, mockRes as unknown as Response)
      expect(mockRes.status).toHaveBeenCalledWith(500)
    })

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

      const mockedCreateWallet = jest.spyOn(walletApis, 'createRapydWallet')
      mockedCreateWallet.mockReturnValueOnce(
        Promise.resolve({
          status: {
            status: 'SUCCESS'
          },
          data: {
            id: 'ewallet-123'
          }
        })
      )
      mockRes.status.mockImplementation(() => mockRes)
      await createWallet(mockReq, mockRes as unknown as Response)
      expect(mockRes.status).toHaveBeenCalledWith(500)
    })
  })
})
