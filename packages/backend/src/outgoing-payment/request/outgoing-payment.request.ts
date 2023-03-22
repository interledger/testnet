import axios from "axios";
import {getSignature} from "../../rafiki/signature.request";
import {createQuote} from "./quote.request";


export async function createOutgoingPayment(keyId: string, paymentPointerUrl: string, incomingPaymentUrl: string, token: string) {
    const quote = await createQuote(keyId, paymentPointerUrl, incomingPaymentUrl, token);
    console.log(quote?.data);

    const body = {
        quoteId: quote?.data.id
    };

    const headers = { authorization: `GNAP ${token}` }
    const url = `${paymentPointerUrl}/outgoing-payments`
    const signatureResponse = await getSignature(keyId, url, 'POST', headers, body);

    return axios.post(url, body,
        { headers: { ...signatureResponse?.data, ...headers }}).catch((e) => { console.log('payment error: ', e.data); throw e});
}
