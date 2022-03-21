import TransactionSigner, {
  TransactionSignerDecorators,
} from '@common/services/TransactionSigner'
import { Transaction } from 'algosdk'
import { Inject } from 'typedi'
import WalletAccountProvider from './DefaultWalletProvider'

@TransactionSignerDecorators.Service()
export default class CustomTransactionSigner implements TransactionSigner {
  @Inject()
  readonly wallets: WalletAccountProvider

  async signTransaction(transaction: Transaction): Promise<Uint8Array> {
    const account = this.wallets.account
    // const signer = algosdk.makeBasicAccountTransactionSigner(account)
    // const [payload] = await signer([transaction], [0])
    // return {
    //   sig: Buffer.from(payload),
    //   txn: transaction,
    // }
    return transaction.signTxn(account.sk)
  }
}
