import axios from "axios";
import {Asset} from "../../rafiki/generated/graphql";
import {getSignature} from "../../rafiki/signature.request";

function getTomorrowDate(): string {
    const tomorrow =  new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString();
}

export async function createIncomingPayment(keyId: string, paymentPointerUrl: string, amount: number, asset: Asset, token: string) {
    const body = {
        incomingAmount: {
            value: amount.toString(),
            assetCode: asset.code,
            assetScale: asset.scale
        },
        expiresAt: getTomorrowDate(),
    };

    const headers = { authorization: `GNAP ${token}` }
    const url = `${paymentPointerUrl}/incoming-payments`
    const signatureResponse = await getSignature(keyId, url, 'POST', headers, body);

    return axios.post(url, body,
        { headers: { ...signatureResponse?.data, ...headers }});
}
