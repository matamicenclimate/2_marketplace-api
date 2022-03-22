import algosdk from 'algosdk'
import WalletAccountProvider, {
  WalletAccountProviderDecorators,
} from './WalletAccountProvider'
import { Inject, Service } from 'typedi'
import AlgodClientProvider from './AlgodClientProvider'
import TransactionSigner, {
  TransactionSignerDecorators,
} from './TransactionSigner'

@Service()
export default class OptInService {
  @Inject()
  readonly clientProvider!: AlgodClientProvider

  @WalletAccountProviderDecorators.Inject()
  readonly walletProvider!: WalletAccountProvider

  @TransactionSignerDecorators.Inject()
  readonly signer!: TransactionSigner

  private get client() {
    return this.clientProvider.client
  }
  static waitForConfirmation = algosdk.waitForConfirmation

  static makeAssetTransferTransaction = algosdk.makeAssetTransferTxnWithSuggestedParams

  async optInAssetByID(assetID: number) {
    const params = await this.client.getTransactionParams().do()
    const walletInfo = this.walletProvider.account
    const sender = walletInfo.addr
    const recipient = sender
    const revocationTarget = undefined
    const closeRemainderTo = undefined
    const note = undefined
    const amount = 0
    const optInTxUnsigned = await OptInService.makeAssetTransferTransaction(
      sender,
      recipient,
      closeRemainderTo,
      revocationTarget,
      amount,
      note,
      assetID,
      params
    )
    const optInTxSigned = await this.signer.signTransaction(optInTxUnsigned)
    const optInSendTx = await this.client.sendRawTransaction(optInTxSigned).do()
    const confirmedOptInTx = await OptInService.waitForConfirmation(
      this.client,
      optInSendTx.txId,
      4
    )

    return confirmedOptInTx
  }
}
