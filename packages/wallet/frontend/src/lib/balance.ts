import { proxy } from 'valtio'

interface Account {
  balance: string
  assetCode: string
  assetScale: number
}

interface AccountState {
  accountsSnapshot: Account[]
}

const state = {
  accountsSnapshot: []
}

export const balanceState = proxy<AccountState>(state)

export function updateBalance(accountUpdate: Account, balance: string): void {
  const currentAccount = balanceState.accountsSnapshot.find(
    (account) => account.assetCode === accountUpdate.assetCode
  )
  if (!currentAccount) {
    balanceState.accountsSnapshot.push(Object.assign({}, accountUpdate))
  } else {
    balanceState.accountsSnapshot = balanceState.accountsSnapshot.map(
      (account) => {
        if (account.assetCode === accountUpdate.assetCode) {
          account.balance = balance
        }
        return account
      }
    )
  }
}
