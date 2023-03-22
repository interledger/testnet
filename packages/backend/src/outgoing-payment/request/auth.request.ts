import axios from "axios";
import env from "../../config/env";
import {getSignature} from "../../rafiki/signature.request";
import {Asset} from "../../rafiki/generated/graphql";
import {AccessAction, AccessType} from "open-payments";

export async function getOutgoingPaymentToken(keyId: string, paymentPointerUrl: string, amount: number, asset: Asset) {
    const body = {
        access_token: {
            access: [
                {
                    type: AccessType.Quote,
                    actions: [
                        AccessAction.Create, AccessAction.Read
                    ]
                },
                {
                    type: AccessType.OutgoingPayment,
                    actions: [
                        AccessAction.Create, AccessAction.Read, AccessAction.List
                    ],
                    identifier: paymentPointerUrl,
                    limits: {
                        sendAmount: {
                            "value": amount.toString(),
                            "assetCode": asset.code,
                            "assetScale": asset.scale
                        },
                        receiveAmount: {
                            value: amount.toString(),
                            assetCode: asset.code,
                            assetScale: asset.scale
                        }
                    }
                }
            ]
        },
        client: paymentPointerUrl,
        interact: {
            start: [
                "redirect"
            ],
            finish: {
                method: "redirect",
                uri: "http://localhost:3003/outgoing-payments-continue",
                nonce: "123"
            }
        }
    }

    const axiosInstance = axios.create({
        withCredentials: true
    });

    const signatureResponse = await getSignature(keyId, env.AUTH_SERVER_GRANT_URL, 'POST', {}, body);
    const interactResponse = await axiosInstance.post(env.AUTH_SERVER_GRANT_URL, body, { headers: signatureResponse?.data }).catch((e) => console.log('auth error: ', e.data))

    console.log(interactResponse?.data);
    const interactId = interactResponse?.data.interact.redirect.match('(?<=interact/)(.*?)(?=/)')[0]
    const continueId = interactResponse?.data.continue.uri.match('continue/(.*)')[1]
    const url = `${env.AUTH_SERVER_GRANT_URL}/continue/${continueId}`
    const headers = { authorization: `GNAP ${interactResponse?.data.continue.access_token.value}` }
    const nounce = interactResponse?.data.interact.finish;

    // Accept grant
    const grant = await axiosInstance.post(`${env.AUTH_SERVER_GRANT_URL}/grant/${interactId}/${nounce}/accept`, {}, {headers: { 'x-idp-secret': 'replace-me'}});
    console.log(grant.data);

    // Finish interaction
    const response = await axiosInstance.get(`${env.AUTH_SERVER_GRANT_URL}/interact/${interactId}/${nounce}/finish`, {headers: { 'x-idp-secret': 'replace-me', Cookie: "cookie1=value; cookie2=value; cookie3=value;"} })
        .catch((e) => { console.log('finish: ', e.data); throw e});
    console.log('grant: ', response?.data);


    const continueBody = {
        interact_ref: response?.data.data.interactRef
    }
    console.log(continueBody);

    // Get access token to continue
    const signatureContinueResponse = await getSignature(keyId, url, 'POST', headers, continueBody);
    return axiosInstance.post(url, continueBody, { headers: { ...signatureContinueResponse?.data, ...headers } })
        .catch((e) => { console.log('auth error: ', e.data); throw e});
}
