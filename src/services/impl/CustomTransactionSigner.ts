import * as TransactionSigner from '@common/services/TransactionSigner'
import * as WalletAccountProvider from '@common/services/WalletAccountProvider'
import { Account, Transaction } from 'algosdk'

@TransactionSigner.declare()
export default class CustomTransactionSigner implements TransactionSigner.type {
  @WalletAccountProvider.inject()
  readonly wallets: WalletAccountProvider.type
  signTransaction(transaction: Transaction): Promise<Uint8Array>
  signTransaction(transaction: Transaction[]): Promise<Uint8Array[]>
  async signTransaction(transaction: Transaction | Transaction[]): Promise<Uint8Array | Uint8Array[]> {
    const account = this.wallets.account
    if (transaction instanceof Array) {
      const promises = transaction.map(t => {
        return this._signTransaction(t, account)
      })
      return Promise.all(promises)
    } else {
      return this._signTransaction(transaction, account)
    }
  }

  async _signTransaction(transaction: Transaction, account: Account): Promise<Uint8Array> {
    return transaction.signTxn(account.sk)
  }
}
