import { Knex } from 'knex'
import { createContainer } from '@/createContainer'
import { env } from '@/config/env'
import { ICreateCustomerRequest, ICreateCustomerResponse } from '@/card/types'
import { GateHubClient } from './gatehub/client'

interface UserData {
  email: string
  walletAddress: string
  firstName: string
  lastName: string
}

const usersData: UserData[] = [
  {
    email: 'user1@example.com',
    walletAddress: '123456789',
    firstName: 'Alice',
    lastName: 'Smith'
  }
]

async function cardManagement() {
  // Initialize container and dependencies
  const container = await createContainer(env)
  const knex = container.resolve<Knex>('knex')
  const gateHubClient = container.resolve<GateHubClient>('gateHubClient')

  try {
    // TODO: Create whitelist table and everything related
    // TODO: Add users to whitelist

    // Fetch card application products
    const cardProducts = await gateHubClient.fetchCardApplicationProducts()
    if (!cardProducts || cardProducts.length === 0) {
      throw new Error('No card application products found.')
    }

    // Use the "code" field from the fetched products
    // Should only be one product
    const productCodes = cardProducts.map((product) => product.code)

    for (const userData of usersData) {
      const { email, walletAddress, firstName, lastName } = userData

      const managedUser = await gateHubClient.createManagedUser(email)

      console.log(`Created managed user for ${email}: ${managedUser.id}`)

      // TODO: Get wallet address from GateHub

      // Create customer using product codes fetched earlier
      const createCustomerRequestBody: ICreateCustomerRequest = {
        walletAddress,
        account: {
          productCode: productCodes[0],
          card: {
            productCode: productCodes[0]
          }
        },
        citizen: {
          name: firstName,
          surname: lastName
        }
      }

      const customer: ICreateCustomerResponse =
        await gateHubClient.createCustomer(createCustomerRequestBody)

      console.log(`Created customer for ${email}: ${customer.id}`)

      // TODO: Map managed user to customer
    }
  } catch (error: any) {
    console.log(`An error occurred: ${error.message}`)
  } finally {
    await knex.destroy()
    await container.dispose()
  }
}

cardManagement().catch((error) => {
  console.error(`Script failed: ${error.message}`)
  process.exit(1)
})
