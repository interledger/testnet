import { createContainer } from '@/createContainer'
import { env } from '@/config/env'
import { Account } from '@/account/model'
import { Transaction } from '@/transaction/model'
import { Model } from 'objection'
import { transformBalance, urlToPaymentId } from '@/utils/helpers'

async function backfillTrxDetails() {
  const container = await createContainer(env)
  const knex = container.resolve('knex')
  Model.knex(knex)
  const rafikiClient = container.resolve('rafikiClient')
  const rafikiService = container.resolve('rafikiService')
  const gateHubClient = container.resolve('gateHubClient')

  async function getOutgoingPaymentSecondParty(paymentId: string) {
    try {
      const outgoingPayment =
        await rafikiClient.getOutgoingPaymentById(paymentId)

      return rafikiService.getOutgoingPaymentSecondPartyByIncomingPaymentId(
        urlToPaymentId(outgoingPayment.receiver)
      )
    } catch (e) {
      console.warn('Error on getting receiver wallet address', e)
    }
  }

  async function getIncomingPaymentSecondParty(paymentId: string) {
    return rafikiService.getIncomingPaymentSenders(paymentId)
  }

  async function backfillCardTrx(account: Account) {
    try {
      if (!account.cardId || !account.user?.gateHubUserId) {
        return
      }

      let page = 1
      const pageSize = 10
      let shouldFetchNext = true
      while (shouldFetchNext) {
        const transactionsResponse = await gateHubClient.getCardTransactions(
          account.cardId,
          account.user.gateHubUserId,
          pageSize,
          page
        )

        if (transactionsResponse.data.length < pageSize) {
          shouldFetchNext = false
        }

        for (const cardTrx of transactionsResponse.data) {
          console.log('processing trx: ', cardTrx.transactionId)
          const existentTrx = await Transaction.query().findOne(
            'paymentId',
            cardTrx.transactionId
          )
          if (!existentTrx) {
            console.log('trx not found: ', cardTrx.transactionId)
            continue
          }

          await Transaction.query()
            .where('id', existentTrx.id)
            .update({
              secondParty: cardTrx.merchantName,
              txAmount: cardTrx.transactionAmount
                ? transformBalance(Number(cardTrx.transactionAmount), 2)
                : undefined,
              conversionRate: cardTrx.mastercardConversion?.convRate,
              txCurrency: cardTrx.transactionCurrency,
              cardTxType: cardTrx.type
            })
          console.log('trx updated: ', existentTrx.paymentId)
        }

        page++
      }
    } catch (e) {
      console.log('Failed to update trx for account: ', account.user.email)
    }
  }

  try {
    const accounts = await Account.query().withGraphFetched('user')

    for (const account of accounts) {
      console.log('processing account: ', account)
      const rafikiTransactions = await Transaction.query()
        .where('accountId', account.id)
        .whereNull('isCard')
      for (const tx of rafikiTransactions) {
        console.log('processing trx: ', tx)
        if (!tx.walletAddressId) {
          continue
        }

        let secondParty
        if (tx.type === 'INCOMING') {
          secondParty = await getIncomingPaymentSecondParty(tx.paymentId)
        } else {
          secondParty = await getOutgoingPaymentSecondParty(tx.paymentId)
        }
        await Transaction.query().where('id', tx.id).update({ secondParty })
        console.log('trx updated')
      }

      await backfillCardTrx(account)
    }
  } catch (error: unknown) {
    console.log(`An error occurred: ${(error as Error).message}`)
  } finally {
    await knex.destroy()
    await container.dispose()
  }
}

backfillTrxDetails()
  .then(() => {
    console.log('finished')
    process.exit(0)
  })
  .catch((error) => {
    console.error(`Script failed: ${error.message}`)
    process.exit(1)
  })
