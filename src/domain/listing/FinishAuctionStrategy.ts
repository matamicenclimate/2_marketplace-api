import { FinishListingStrategy } from "src/interfaces";
import CustomLogger from '../../infrastructure/CustomLogger';
import algosdk from "algosdk";
import { CreateListingRequest, CreateListingSignedTransactions } from "@common/lib/api/endpoints";
import AlgodClientProvider from "@common/services/AlgodClientProvider";



export default class FinishAuctionStrategy implements FinishListingStrategy {
  private logger: CustomLogger
  private signedTxn: CreateListingSignedTransactions
  readonly clientProvider: AlgodClientProvider

  constructor (private body: CreateListingRequest) {
    this.signedTxn = body.signedTxn
    this.logger = new CustomLogger()
  }

  async execute(): Promise<void> {
    const txnBlob = [
      Buffer.from(Object.values(this.signedTxn.signedOpnInTxn)),
      Buffer.from(Object.values(this.signedTxn.signedFundAppTxn)),
      Buffer.from(Object.values(this.signedTxn.signedAppCallTxn)),
      Buffer.from(Object.values(this.signedTxn.signedPayGasTxn)),
      Buffer.from(Object.values(this.signedTxn.signedFundNftTxn)),
    ]
    const { txId } = await this.client.sendRawTransaction(txnBlob).do()
    const result = await algosdk.waitForConfirmation(this.client, txId, 9)
    this.logger.info('Smart Contract create auction finished', { txId })
  }

  private get client() {
    return this.clientProvider.client
  }
}