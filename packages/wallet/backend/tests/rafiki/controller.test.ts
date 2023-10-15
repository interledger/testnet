import { env } from "@/config/env";
import { createContainer } from "@/createContainer";
import { RafikiController } from "@/rafiki/controller";
import { Request, Response } from "express";
import { MockRequest, MockResponse, createRequest, createResponse } from "node-mocks-http";
import { Logger } from "winston";

describe('Rafiki controller', () => { 
    let req: MockRequest<Request>
    let res: MockResponse<Response> 
    const next = jest.fn()
    req = createRequest()
    res = createResponse()

    describe("Get Rates", () => {
        it("should return status 200", async () => {
            const bindings = createContainer(env)
            const rfkService = await bindings.resolve('rafikiService')
            const rtsService = await bindings.resolve('ratesService')
            const deps = {
                logger: new Logger(),
                rafikiService: rfkService,
                ratesService: rtsService,
            }
            const controller = new RafikiController(deps)
            await controller.getRates(req, res, next)
            expect(res.statusCode).toBe(200);
        })
    })
});