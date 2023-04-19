import { GraphQLClient } from 'graphql-request'
import env from '../config/env'

export const graphqlClient = new GraphQLClient(env.GRAPHQL_ENDPOINT)
