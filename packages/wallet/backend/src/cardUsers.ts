import { createContainer } from '@/createContainer'
import { env } from '@/config/env'
import { ICreateCustomerRequest } from '@/card/types'

interface UserData {
  email: string
  firstName: string
  lastName: string
  ppNumber: string
}

const entries = `John;Doe;john@doe.com;8888
Alice;Smith;alice@smith.com;9999`

function processEntries() {
  const users: Array<UserData> = []
  const lines = entries.split('\n')
  for (const line of lines) {
    const [firstName, lastName, email, ppNumber] = line.split(';')
    users.push({
      email,
      firstName,
      lastName,
      ppNumber
    })
  }

  return users
}

async function cardManagement() {
  const container = await createContainer(env)
  const logger = container.resolve('logger')
  const knex = container.resolve('knex')
  const gateHubClient = container.resolve('gateHubClient')
  const accountProductCode = env.GATEHUB_ACCOUNT_PRODUCT_CODE
  const cardProductCode = env.GATEHUB_CARD_PRODUCT_CODE
  const nameOnCard = env.GATEHUB_NAME_ON_CARD
  const ppPrefix = env.GATEHUB_CARD_PP_PREFIX
  const GATEWAY_UUID = env.GATEHUB_GATEWAY_UUID

  try {
    const usersData = processEntries()

    for (const userData of usersData) {
      const { email, firstName, lastName, ppNumber } = userData

      const managedUser = await gateHubClient.createManagedUser(email)

      logger.info(`Created managed user for ${email}: ${managedUser.id}`)

      await gateHubClient.connectUserToGateway(managedUser.id, GATEWAY_UUID)

      logger.info(
        `Connected user ${managedUser.id} - ${managedUser.email} to gateway`
      )

      const user = await gateHubClient.getWalletForUser(managedUser.id)
      const walletAddress = user.wallets[0].address

      logger.info(`Retrieved user ${managedUser.id} wallet - ${walletAddress}`)

      // Create customer using product codes as env vars
      const createCustomerRequestBody: ICreateCustomerRequest = {
        walletAddress,
        account: {
          productCode: accountProductCode,
          currency: 'EUR',
          card: {
            productCode: cardProductCode
          }
        },
        nameOnCard,
        citizen: {
          name: firstName,
          surname: lastName
        }
      }

      const customer = await gateHubClient.createCustomer(
        managedUser.id,
        createCustomerRequestBody
      )

      logger.info(`Created customer for ${email}: ${customer.customers.id}`)

      const pp = ppPrefix + ppNumber
      await gateHubClient.updateMetaForManagedUser(managedUser.id, {
        paymentPointer: pp.toLowerCase(),
        customerId: customer.customers.id!
      })

      logger.info(`Updated meta object for user ${email}`)

      const accounts = customer.customers.accounts![0]
      const card = accounts.cards![0]

      await gateHubClient.orderPlasticForCard(managedUser.id, card.id)
    }
  } catch (error: unknown) {
    console.log(`An error occurred: ${(error as Error).message}`)
  } finally {
    await knex.destroy()
    await container.dispose()
  }
}

cardManagement().catch((error) => {
  console.error(`Script failed: ${error.message}`)
  process.exit(1)
})
