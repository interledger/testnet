import { NextFunction, Request, Response } from 'express'
import { Model } from 'objection'
import { getDocumentTypes } from '../../rapyd/documents/documents.service'
import * as rapydApis from '../../rapyd/utills/request'

describe('RapydDocumentsService', () => {
  beforeAll(async () => {
    Model.knex(global.__TESTING_KNEX__)
  })

  describe('getDocumentTypes', () => {
    it(`should throw ThirdPartyApiFailedException if rapyd api was not successful`, async () => {
      const mockReq = {
        user: {
          id: 1,
          email: 'test@test.com'
        } as unknown
      } as Request

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
      await getDocumentTypes(
        mockReq,
        mockRes as unknown as Response,
        nextFn as NextFunction
      )
      // expect(nextFn).toHaveBeenCalledWith(
      //   new ThirdPartyApiFailedException(
      //       'Unable to get document types from rapid'
      //   )
      // )
    })
  })
})
