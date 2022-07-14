import { FinishListingStrategy } from 'src/interfaces'
import CustomLogger from '../../infrastructure/CustomLogger'
import algosdk from 'algosdk'
import {
  CreateListingSignedTransactions,
  FinishCreateListingRequest,
} from '@common/lib/api/endpoints'
import AlgodClientProvider from '@common/services/AlgodClientProvider'
import Container from 'typedi'

export default class FinishDirectListingStrategy implements FinishListingStrategy {
  private logger: CustomLogger
  private signedTxn: CreateListingSignedTransactions
  readonly clientProvider: AlgodClientProvider

  constructor(private body: FinishCreateListingRequest) {
    this.signedTxn = body.signedTxn
    this.logger = new CustomLogger()
    this.clientProvider = Container.get(AlgodClientProvider)
  }

  async execute(): Promise<void> {
    const txnBlob = [
      this.signedTxn.signedOptInTxn,
      this.signedTxn.signedTransferTxn,
      this.signedTxn.signedFundAppTxn,
      this.signedTxn.signedAppCallTxn,
      this.signedTxn.signedFundNftTxn,
    ].map(_ => Buffer.from(_, 'base64'))
    const { txId } = await this.client.sendRawTransaction(txnBlob).do()
    const result = await algosdk.waitForConfirmation(this.client, txId, 9)
    this.logger.info('Smart Contract create direct listing finished', { txId })
  }

  private get client() {
    return this.clientProvider.client
  }
}