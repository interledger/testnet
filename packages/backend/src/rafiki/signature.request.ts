import axios from "axios";
import env from "../config/env";

export type MethodType = 'POST' | 'GET';
export function getSignature(keyId: string, url: string, method: MethodType, headers: Record<string, string>, body: Record<string, unknown>) {
    return axios.post(env.SIGNATURE_URL, {
        keyId,
        request: {
            url,
            method,
            headers,
            body: JSON.stringify(body)
        }
    }, {})
}
