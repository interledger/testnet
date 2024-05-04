import swaggerJsdoc from 'swagger-jsdoc'
import { AccountPaths, AccountSchema } from '@/account/account.docs'
const options = {
  definition: {
    openapi: '3.1.0',
    info: {
      title: 'Rafiki Wallet Express API with Swagger',
      version: '0.1.0',
      description:
        'This is a simple CRUD API application made with Express and documented with Swagger',
      license: {
        name: 'MIT',
        url: 'https://spdx.org/licenses/MIT.html'
      },
      contact: {
        name: 'LogRocket',
        url: 'https://logrocket.com',
        email: 'info@email.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3003'
      }
    ],
    tags: [{ name: 'account' }],
    paths: {
      ...AccountPaths
    },
    components: {
      schemas: {
        Account: AccountSchema
      }
    }
  },
  apis: []
}

const specs = swaggerJsdoc(options)

export default specs
