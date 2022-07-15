import {
  ListingStrategy,
  AuctionCreateAppData,
  CauseAppInfo,
} from 'src/interfaces'
import { AssetNormalized } from '../../interfaces/index'
import CustomLogger from '../../infrastructure/CustomLogger'
import { AuctionLogic } from '@common/services/AuctionLogic'
import * as WalletAccountProvider from '@common/services/WalletAccountProvider'
import * as TransactionSigner from '@common/services/TransactionSigner'
import Container from 'typedi'
import config from 'src/config/default'
import algosdk from 'algosdk'
import { CreateListingResponse } from '@common/lib/api/endpoints'
import AlgodClientProvider from '@common/services/AlgodClientProvider'
import ListingTransactions from './ListingTransactions'
import Application from './Application'

export default class AuctionStrategy implements ListingStrategy {
  readonly auctionLogic: AuctionLogic
  private logger: CustomLogger
  @TransactionSigner.inject()
  readonly signer: TransactionSigner.type
  readonly clientProvider: AlgodClientProvider
  readonly walletProvider: WalletAccountProvider.type
  readonly application: Application

  constructor(
    private cause: CauseAppInfo,
    private listingTransactions: ListingTransactions
  ) {
    this.auctionLogic = Container.get(AuctionLogic)
    this.clientProvider = Container.get(AlgodClientProvider)
    this.walletProvider = WalletAccountProvider.get()
    this.logger = new CustomLogger()
    this.application = new Application()
  }

  async execute(
    body: AuctionCreateAppData,
    asset: AssetNormalized
  ): Promise<CreateListingResponse> {
    this._avoidErrorMetadataQuantityOnBlockchain(asset)
    const appIndex = await this.createApp(
      body.assetId,
      asset,
      body.creatorWallet,
      body.startDate as string,
      body.endDate as string
    )
    this.logger.info(
      `DONE: Sending back the asset ${body.assetId} to wallet owner.`
    )

    const unsignedTxnGroup = await this.createGroupTxn(
      appIndex,
      body.assetId,
      body.creatorWallet,
      asset
    )

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

  _avoidErrorMetadataQuantityOnBlockchain(asset: AssetNormalized) {
    delete asset.note
  }

  async createAuctionApp(
    assetId: number,
    reserve: number,
    creatorWallet: string,
    startDate: string,
    endDate: string
  ): Promise<number> {
    this.logger.info(`Creating auction`)
    const auction = await this.auctionLogic.createAuctionApp(
      assetId,
      reserve,
      parseInt(config.bid.increment),
      this.cause,
      creatorWallet,
      startDate,
      endDate
    )
    const appIndex = auction['application-index']
    //TODO early return. Qué pasa si no ha creado la App. Reintentos? throw error?
    if (!appIndex) {
      throw new Error('Cannot create Auction App')
    }
    return appIndex
  }

  async createApp(
    assetId: number,
    asset: AssetNormalized,
    creatorWallet: string,
    startDate: string,
    endDate: string
  ) {
    if (!asset?.arc69?.properties?.cause || !asset?.arc69?.properties?.price) {
      throw new Error(
        'Nft must be minted in our marketplace, cause and price fields not present'
      )
    }

    this.logger.info('Creating auction')
    const appIndex = await this.createAuctionApp(
      assetId,
      asset.arc69.properties.price,
      creatorWallet,
      startDate,
      endDate
    )
    const appAddr = this.application.getApplicationAddressFromAppIndex(appIndex)
    this.logger.info(`App wallet is ${appAddr}`)
    return appIndex
  }
}
