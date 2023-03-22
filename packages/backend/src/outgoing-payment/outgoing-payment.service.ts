import {NextFunction, Request, Response} from "express";
import {BaseResponse} from "../shared/models/BaseResponse";
import {zParse} from "../middlewares/validator";
import {PaymentPointerModel} from "../payment-pointer/payment-pointer.model";
import {BadRequestException} from "../shared/models/errors/BadRequestException";
import {getAsset} from "../rafiki/request/asset.request";
import {NotFoundException} from "../shared/models/errors/NotFoundException";
import {getOutgoingPaymentToken} from "./request/auth.request";
import {createOutgoingPayment} from "./request/outgoing-payment.request";
import {outgoingPaymentSchema} from "./outgoing-payment.schema";
import {TransactionModel} from "../transaction/transaction.model";
import {getUserIdFromRequest} from "../utils/getUserId";
import {findAccountById} from "../account/account.service";

export const createPayment = async (
    req: Request,
    res: Response<BaseResponse<TransactionModel>>,
    next: NextFunction
) => {
    try {
        const { incomingPaymentUrl, paymentPointerId, amount } = await zParse(
            outgoingPaymentSchema,
            req
        )

        const userId = getUserIdFromRequest(req)
        const existingPaymentPointer = await PaymentPointerModel.query().findById(paymentPointerId)
        if (!existingPaymentPointer) {
            throw new BadRequestException('Invalid payment pointer');
        }

        const { assetRafikiId: assetId } = await findAccountById(existingPaymentPointer.accountId, userId)

        console.log(existingPaymentPointer);

        // https not configured
        const url = existingPaymentPointer.url.replace('https', 'http');

        const asset = await getAsset(assetId)
        if (!asset) {
            throw new NotFoundException()
        }

        const keyId = `keyid-${existingPaymentPointer.accountId}`;
        const authorizationResponse = await getOutgoingPaymentToken(keyId, url, amount, asset);
        console.log(authorizationResponse?.data);

        const response = await createOutgoingPayment(keyId, url, incomingPaymentUrl, authorizationResponse?.data.access_token.value)

        console.log(response?.data);
        const transaction = await TransactionModel.query().insert({
            paymentPointerId: existingPaymentPointer.id,
            paymentId: response?.data.id,
            assetCode: asset.code,
            value: amount,
            type: 'OUTGOING',
            status: 'PENDING'
        })

        return res.json({
            success: true,
            message: 'Outgoing payment created',
            data: transaction
        })
    } catch (e) {
        next(e)
    }
}

export const continueRequest = async (
    req: Request,
    res: Response<BaseResponse<Record<string, string>>>,
    next: NextFunction
) => {
    try {
        console.log(req.query.interact_ref);

        return res.json({
            success: true,
            message: 'Continue request',
            data: { interactRef: req.query.interact_ref as string }
        })
    } catch (e) {
        next(e)
    }
}
