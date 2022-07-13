import { FinishListingStrategy } from 'src/interfaces'
import CustomLogger from '../../infrastructure/CustomLogger'
import algosdk from 'algosdk'
import {
  CreateListingRequest,
  CreateListingSignedTransactions,
} from '@common/lib/api/endpoints'
import AlgodClientProvider from '@common/services/AlgodClientProvider'
import Container from 'typedi'

export default class FinishAuctionStrategy implements FinishListingStrategy {
  private logger: CustomLogger
  private signedTxn: CreateListingSignedTransactions
  readonly clientProvider: AlgodClientProvider

  constructor(private body: CreateListingRequest) {
    this.signedTxn = body.signedTxn
    this.logger = new CustomLogger()
    this.clientProvider = Container.get(AlgodClientProvider)
  }

  async execute(): Promise<void> {
    const txnBlob = [
      Buffer.from(this.signedTxn.signedOpnInTxn, 'base64'),
      Buffer.from(this.signedTxn.signedFundAppTxn, 'base64'),
      Buffer.from(this.signedTxn.signedAppCallTxn, 'base64'),
      Buffer.from(this.signedTxn.signedPayGasTxn, 'base64'),
      Buffer.from(this.signedTxn.signedFundNftTxn, 'base64'),
    ]
    const { txId } = await this.client.sendRawTransaction(txnBlob).do()
    const result = await algosdk.waitForConfirmation(this.client, txId, 9)
    this.logger.info('Smart Contract create auction finished', { txId })
  }

  private get client() {
    return this.clientProvider.client
  }
}
