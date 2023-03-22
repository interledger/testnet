import axios from "axios";
import env from "../../config/env";
import {getSignature} from "../../rafiki/signature.request";
import {AccessAction, AccessType} from "open-payments";

export async function getIncomingPaymentToken(keyId: string, paymentPointerUrl: string) {
    const body = {
        access_token: {
            access: [
                {
                    type: AccessType.IncomingPayment,
                    actions: [
                        AccessAction.Create, AccessAction.Read, AccessAction.List, AccessAction.Complete
                    ]
                }
            ]
        },
        client: paymentPointerUrl
    }
    const signatureResponse = await getSignature(keyId, env.AUTH_SERVER_GRANT_URL, 'POST', {}, body);

    return axios.post(env.AUTH_SERVER_GRANT_URL, body, { headers: signatureResponse?.data })
}
