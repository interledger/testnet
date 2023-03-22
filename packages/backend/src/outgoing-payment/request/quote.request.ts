import {getSignature} from "../../rafiki/signature.request";
import axios from "axios";

export async function createQuote(keyId: string, paymentPointerUrl: string, incomingPaymentUrl: string, token: string) {
    const body = {
        receiver: incomingPaymentUrl,
    };

    const headers = { authorization: `GNAP ${token}` }
    const url = `${paymentPointerUrl}/quotes`
    const signatureResponse = await getSignature(keyId, url, 'POST', headers, body);

    return axios.post(url, body,
        { headers: { ...signatureResponse?.data, ...headers }}).catch((e) => { console.log('quote error: ', e.data); throw e});
}
