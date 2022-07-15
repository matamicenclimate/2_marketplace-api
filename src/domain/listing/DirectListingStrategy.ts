import { CreateListingResponse } from "@common/lib/api/endpoints";
import { AuctionLogic } from "@common/services/AuctionLogic";
import * as WalletAccountProvider from '@common/services/WalletAccountProvider'
import * as TransactionSigner from '@common/services/TransactionSigner'
import algosdk from "algosdk";
import CustomLogger from "src/infrastructure/CustomLogger";
import { AssetNormalized, AuctionCreateAppData, CauseAppInfo, ListingStrategy } from "src/interfaces";
import Container from "typedi";
import ListingTransactions from "./ListingTransactions";
import Application from "./Application";


export default class DirectLisgingStrategy implements ListingStrategy {
  readonly auctionLogic: AuctionLogic
  readonly account: WalletAccountProvider.type
  private logger: CustomLogger
  @TransactionSigner.inject() 
  readonly signer: TransactionSigner.type
  readonly application: Application

  constructor (private cause: CauseAppInfo, private listingTransactions: ListingTransactions) {
    this.auctionLogic = Container.get(AuctionLogic)
    this.logger = new CustomLogger()
    this.application = new Application()
  }

  
  async execute(body: AuctionCreateAppData, asset: AssetNormalized): Promise<CreateListingResponse> {
    const note = asset.note
    this._avoidErrorMetadataQuantityOnBlockchain(asset)
    const price = asset.arc69.properties.price
    if (!price) throw new Error('Price must be present on asset')
    const appIndex = await this.createDirectListingApp(
      body.assetId,
      price,
      this.cause.causeWallet,
      body.creatorWallet,
      body.causePercentage,
      this.cause.creatorPercentage,
    )

    const unsignedTxnGroup = await this.createGroupTxn(
      appIndex,
      body.assetId,
      body.creatorWallet,
      asset
    )

    /* @ts-ignore */
    return { appIndex, unsignedTxnGroup }
  }

  async createGroupTxn(
    appIndex: number,
    assetId: number,
    clientAddress: string,
    asset: AssetNormalized
  ): Promise<CreateListingResponse['unsignedTxnGroup']> {
    await this.listingTransactions.addAssetOptInRequest(assetId)
    await this.listingTransactions.addAssetTransferRequest(
      assetId,
      clientAddress,
      this.listingTransactions.walletProvider.account.addr,
      1
    )
    await this.listingTransactions.addFundListing(appIndex)
    await this.listingTransactions.addApplicationCall(appIndex, assetId)
    const note = this.application.getNote(asset, appIndex)
    await this.listingTransactions.makeTransferTransactions(
      appIndex,
      assetId,
      note
    )
    return await this.prepareTransactions()
  }

  private async prepareTransactions(): Promise<
    CreateListingResponse['unsignedTxnGroup']
  > {
    // TODO Add tuple-type restriction (narrow the type) to the transaction array.
    const [optIn, transfer, fundApp, appCall, payGas, fundNft] =
      algosdk.assignGroupID(this.listingTransactions.transactions)
    const signedOptInTxn = this.prepareTransactionForTransportLayer(
      await this.listingTransactions.signTxn(optIn)
    )
    const encodedTransferTxn = this.prepareTransactionForTransportLayer(
      this.listingTransactions.encodeUnsignedTxn(transfer)
    )
    const signedFundAppTxn = this.prepareTransactionForTransportLayer(
      await this.listingTransactions.signTxn(fundApp)
    )
    const signedAppCallTxn = this.prepareTransactionForTransportLayer(
      await this.listingTransactions.signTxn(appCall)
    )
    const signedPayGasTxn = this.prepareTransactionForTransportLayer(
      await this.listingTransactions.signTxn(payGas)
    )
    const signedFundNftTxn = this.prepareTransactionForTransportLayer(
      await this.listingTransactions.signTxn(fundNft)
    )

    return {
      signedOptInTxn,
      encodedTransferTxn,
      signedFundAppTxn,
      signedAppCallTxn,
      signedPayGasTxn,
      signedFundNftTxn,
    }
  }

  private prepareTransactionForTransportLayer(txn: Uint8Array) {
    return Buffer.from(txn).toString('base64')
  }

  async createDirectListingApp(
    assetId: number,
    reserve: number,
    causeWallet: string,
    creatorWallet: string,
    causePercentage: number,
    creatorPercentage: number,
  ): Promise<number> {
    try {
      this.logger.info(`Creating directListing`)
      const app = await this.auctionLogic.createDirectListing(
        assetId,
        reserve,
        causeWallet,
        creatorWallet,
        causePercentage,
        creatorPercentage,
      )

      return app['application-index']
    } catch(error) {
      this.logger.error('Error creating direct listing app', { message: error.message, stack: error.stack })
      throw error
    }
  }
  _avoidErrorMetadataQuantityOnBlockchain(asset: AssetNormalized) {
    delete asset.note
  }

}