import TransactionSigner, {
  TransactionSignerDecorators,
} from '../../climate-nft-common-module/src/services/TransactionSigner'
import { WalletAccountProviderDecorators } from '../../climate-nft-common-module/src/services/WalletAccountProvider'
import { Account, Transaction } from 'algosdk'
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
    return this._signTransaction(transaction, account)
  }

  async _signTransaction(transaction: Transaction, account: Account): Promise<Uint8Array> {
    return transaction.signTxn(account.sk)
  }
}
