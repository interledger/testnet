import { GraphQLClient } from 'graphql-request'
import { App } from './app'
import { env } from './config/env'
import { createContainer } from './createContainer'

const container = createContainer(env)
//! For now, until we determine if this needs to be dependency injected as well.
export const graphqlClient = new GraphQLClient(env.GRAPHQL_ENDPOINT)

const app = new App(container)

export const start = async (app: App): Promise<void> => {
  await app.startServer()
}

if (!module.parent) {
  start(app).catch(async (e): Promise<void> => {
    console.log(e)
  })
}
