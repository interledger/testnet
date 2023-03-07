import {request} from 'graphql-request'
import env from '../config/env'
import {Mutation, Query} from "./generated/graphql";

const GRAPHQL_ENDPOINT = env.GRAPHQL_ENDPOINT

export async function requestGQL<T extends Partial<Mutation | Query>>(query: string, variables?: Record<string, unknown>, headers?: Record<string, string>): Promise<T> {
    return request({
        url: GRAPHQL_ENDPOINT,
        document: query,
        variables: variables,
        requestHeaders: headers,
    })
}
