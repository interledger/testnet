import { createContainer } from '@/createContainer'
import { env } from '@/config/env'

interface Entry {
  userUuid: string
  accountId: string
  cardId: string
  customerId: string
  walletAddress: string
  email: string
  deliveryAddressId: string
}

const entries = `userUuid1,accountId1,cardId1,customerId1,walletAddress1,john@doe.com,deliveryAddressId1
userUuid2,accountId2,cardId2,customerId2,walletAddress2,alice@smith.com,deliveryAddressId2`

function processEntries() {
  const e: Array<Entry> = []
  const lines = entries.split('\n')
  for (const line of lines) {
    const [
      userUuid,
      accountId,
      cardId,
      customerId,
      walletAddress,
      email,
      deliveryAddressId
    ] = line.split(',')
    e.push({
      userUuid,
      accountId,
      cardId,
      customerId,
      walletAddress,
      email,
      deliveryAddressId
    })
  }

  return e
}

async function reorder() {
  const container = await createContainer(env)
  const logger = container.resolve('logger')
  const knex = container.resolve('knex')
  const gateHubClient = container.resolve('gateHubClient')
  const accountProductCode = env.GATEHUB_ACCOUNT_PRODUCT_CODE
  const cardProductCode = env.GATEHUB_CARD_PRODUCT_CODE

  try {
    const entries = processEntries()

    for (const entry of entries) {
      const { userUuid, accountId, cardId, walletAddress, deliveryAddressId } =
        entry

      await gateHubClient.closeCard(
        userUuid,
        cardId,
        // @ts-expect-error we know
        'IssuerRequestIncorrectOpening'
      )

      logger.info(`Closed card with cardId: ${cardId}; user: ${userUuid}`)

      const card = await gateHubClient.createCard(userUuid, accountId, {
        nameOnCard: 'INTERLEDGER',
        deliveryAddressId,
        walletAddress,
        currency: 'EUR',
        productCode: accountProductCode,
        card: { productCode: cardProductCode }
      })

      logger.info(
        `Created card with cardId: ${card.id}; customerId: ${card.customerId}`
      )

      await gateHubClient.orderPlasticForCard(
        '32c471ae-f7d3-4ca9-ac95-68345013d1d4',
        '24BFDC8415D73F4CE0634701650AB9E6'
      )

      logger.info(
        `Ordered plastic card for user: ${userUuid}; new card id: ${card.id}`
      )
    }
  } catch (error: unknown) {
    console.log(`An error occurred: ${(error as Error).message}`)
  } finally {
    await knex.destroy()
    await container.dispose()
  }
}

reorder().catch((error) => {
  console.error(`Script failed: ${error.message}`)
  process.exit(1)
})
