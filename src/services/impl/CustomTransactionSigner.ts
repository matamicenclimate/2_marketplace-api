import * as TransactionSigner from '@common/services/TransactionSigner'
import * as WalletAccountProvider from '@common/services/WalletAccountProvider'
import { Account, Transaction } from 'algosdk'

@TransactionSigner.declare()
export default class CustomTransactionSigner implements TransactionSigner.type {
  @WalletAccountProvider.inject()
  readonly wallets: WalletAccountProvider.type

  async signTransaction(transaction: Transaction): Promise<Uint8Array> {
    const account = this.wallets.account
    // const signer = algosdk.makeBasicAccountTransactionSigner(account)
    // const [payload] = await signer([transaction], [0])
    // return {
    //   sig: Buffer.from(payload),
    //   txn: transaction,
    // }
    return this._signTransaction(transaction, account)
  }

  async _signTransaction(transaction: Transaction, account: Account): Promise<Uint8Array> {
    return transaction.signTxn(account.sk)
  }
}
