import {NextFunction, Request, Response} from "express";
import {BaseResponse} from "../shared/models/BaseResponse";
import {zParse} from "../middlewares/validator";
import {incomingPaymentSchema} from "./incoming-payment.schema";
import {PaymentPointerModel} from "../payment-pointer/payment-pointer.model";
import {BadRequestException} from "../shared/models/errors/BadRequestException";
import {getAsset} from "../rafiki/request/asset.request";
import {NotFoundException} from "../shared/models/errors/NotFoundException";
import {getIncomingPaymentToken} from "./request/auth.request";
import {createIncomingPayment} from "./request/incoming-payment.request";
import {TransactionModel} from "../transaction/transaction.model";
import {getUserIdFromRequest} from "../utils/getUserId";
import {findAccountById} from "../account/account.service";

export const createPayment = async (
    req: Request,
    res: Response<BaseResponse<TransactionModel>>,
    next: NextFunction
) => {
    try {
        const { paymentPointerId, amount } = await zParse(
            incomingPaymentSchema,
            req
        )

        const userId = getUserIdFromRequest(req)
        const existingPaymentPointer = await PaymentPointerModel.query().findById(paymentPointerId)
        if (!existingPaymentPointer) {
            throw new BadRequestException('Invalid payment pointer');
        }

        const { assetRafikiId: assetId } = await findAccountById(existingPaymentPointer.accountId, userId)

        // https not configured
        const url = existingPaymentPointer.url.replace('https', 'http');

        const asset = await getAsset(assetId)
        if (!asset) {
            throw new NotFoundException()
        }

        const keyId = `keyid-${existingPaymentPointer.accountId}`;
        const authorizationResponse = await getIncomingPaymentToken(keyId, url);

        const response = await createIncomingPayment(keyId, url, amount, asset, authorizationResponse?.data.access_token.value)

        console.log(response?.data);

        const transaction = await TransactionModel.query().insert({
            paymentPointerId: existingPaymentPointer.id,
            paymentId: response?.data.id,
            assetCode: asset.code,
            value: amount,
            type: 'INCOMING',
            status: 'PENDING'
        })

        return res.json({
            success: true,
            message: 'Incoming payment created',
            data: transaction
        })
    } catch (e) {
        next(e)
    }
}
