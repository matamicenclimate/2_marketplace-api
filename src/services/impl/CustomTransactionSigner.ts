import TransactionSigner, {
  TransactionSignerDecorators,
} from '@common/services/TransactionSigner'
import { WalletAccountProviderDecorators } from '@common/services/WalletAccountProvider'
import { Transaction } from 'algosdk'
import WalletAccountProvider from './DefaultWalletProvider'

@TransactionSignerDecorators.Service()
export default class CustomTransactionSigner implements TransactionSigner {
  @WalletAccountProviderDecorators.Inject()
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
