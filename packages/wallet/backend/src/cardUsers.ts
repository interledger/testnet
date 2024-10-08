import { Knex } from 'knex'
import { createContainer } from '@/createContainer'
import { env } from '@/config/env'
import { ICreateCustomerRequest, ICreateCustomerResponse } from '@/card/types'
import { GateHubClient } from './gatehub/client'
import fs from 'fs'
import path from 'path'
import csv from 'csv-parser'

interface UserData {
  email: string
  firstName: string
  lastName: string
  ppNumber: string
}

async function readUsersData(): Promise<UserData[]> {
  const usersData: UserData[] = []
  const csvFilePath = path.resolve(__dirname, 'users.csv')

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
        usersData.push({
          email: row.email,
          firstName: row.firstName,
          lastName: row.lastName,
          ppNumber: row.ppNumber
        })
      })
      .on('end', () => {
        console.log('CSV file successfully processed')
        resolve(usersData)
      })
      .on('error', (error) => {
        reject(error)
      })
  })
}

async function cardManagement() {
  const container = await createContainer(env)
  const knex = container.resolve<Knex>('knex')
  const gateHubClient = container.resolve<GateHubClient>('gateHubClient')
  const accountProductCode = env.GATEHUB_ACCOUNT_PRODUCT_CODE
  const cardProductCode = env.GATEHUB_CARD_PRODUCT_CODE
  const nameOnCardPrefix = env.NAME_ON_CARD_PREFIX

  try {
    const usersData = await readUsersData()

    for (const userData of usersData) {
      const { email, ppNumber, firstName, lastName } = userData

      const managedUser = await gateHubClient.createManagedUser(email)

      console.log(`Created managed user for ${email}: ${managedUser.id}`)

      const wallet = await gateHubClient.getWalletForUser(
        managedUser.id
      )

      // Create customer using product codes as env vars
      const createCustomerRequestBody: ICreateCustomerRequest = {
        walletAddress: wallet.address,
        account: {
          productCode: accountProductCode,
          card: {
            productCode: cardProductCode
          }
        },
        nameOnCard: nameOnCardPrefix + ppNumber,
        citizen: {
          name: firstName,
          surname: lastName
        }
      }

      const customer: ICreateCustomerResponse =
        await gateHubClient.createCustomer(createCustomerRequestBody)

      console.log(`Created customer for ${email}: ${customer.id}`)

      const pp = nameOnCardPrefix + ppNumber
      await gateHubClient.updateMetaForManagedUser(
        managedUser.id,
        pp.split(' ')[1].toLowerCase
      )
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
