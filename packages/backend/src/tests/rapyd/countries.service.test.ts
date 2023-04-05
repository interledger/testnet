import { NextFunction, Request, Response } from 'express'
import { Model } from 'objection'
import { getCountryNames } from '../../rapyd/countries/countries.service'
import * as rapydApis from '../../rapyd/utills/request'
import { ThirdPartyApiFailedException } from '../../shared/models/errors/ThirdPartyApiFailedException'

describe('WalletService', () => {
  beforeAll(async () => {
    Model.knex(global.__TESTING_KNEX__)
  })

  describe('getCountryNames', () => {
    it(`should throw ThirdPartyApiFailedException if rapyd api was not successful`, async () => {
      const mockRes = {
        json: jest.fn(),
        status: jest.fn()
      }

      const mockedRapydRequest = jest.spyOn(rapydApis, 'makeRapydGetRequest')
      mockedRapydRequest.mockReturnValueOnce(
        Promise.resolve({
          status: {
            status: 'FAILED'
          }
        })
      )
      const nextFn = jest.fn()

      mockRes.status.mockImplementation(() => mockRes)
      await getCountryNames(
        {} as Request,
        mockRes as unknown as Response,
        nextFn as NextFunction
      )
      expect(nextFn).toHaveBeenCalledWith(
        new ThirdPartyApiFailedException(
          'Unable to get country names from rapyd'
        )
      )
    })
  })
})
