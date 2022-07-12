import { ListingStrategy, AuctionCreateAppData, CauseAppInfo, SellingData } from "src/interfaces";
import { AssetNormalized } from '../../interfaces/index';
import { DataSource } from 'typeorm';
import CustomLogger from '../../infrastructure/CustomLogger';
import ListingService from '../../services/ListingService';
import { Value } from '../../../climate-nft-common/src/lib/AuctionCreationResult';
import { AuctionLogic } from '@common/services/AuctionLogic'
import * as WalletAccountProvider from '@common/services/WalletAccountProvider'
import * as TransactionSigner from '@common/services/TransactionSigner'
import Container from "typedi";
import config from "src/config/default";
import algosdk, { TransactionLike } from "algosdk";
import { CreateListingResponse } from "@common/lib/api/endpoints";
import AlgodClientProvider from "@common/services/AlgodClientProvider";



export default class AuctionStrategy implements ListingStrategy {
  readonly auctionLogic: AuctionLogic
  readonly account: WalletAccountProvider.type
  private logger: CustomLogger
  @TransactionSigner.inject() 
  readonly signer: TransactionSigner.type
  readonly clientProvider: AlgodClientProvider
  readonly walletProvider: WalletAccountProvider.type

  constructor (private cause: CauseAppInfo) {
    this.auctionLogic = Container.get(AuctionLogic)
    this.clientProvider = Container.get(AlgodClientProvider)
    this.walletProvider = WalletAccountProvider.get()
    this.logger = new CustomLogger()
  }


  // async storeSellingData(db: DataSource, body: AuctionCreateAppData, asset:AssetNormalized, appIndex: number) {
  //   body.startDate
  //   const data: SellingData = {
  //     asset,
  //     cause: asset.arc69.properties.cause,
  //     assetUrl: asset.image_url ?? '',
  //     isClosed: false,
  //     appIndex,
  //     body.assetId,
  //     wallet: this.account.account.addr,
  //     body.,
  //     body.endDate,
  //   }
  //   data.asset.note = note

  //   this.sellingsService.store(data, db)
  // }

  public getApplicationAddressFromAppIndex(appIndex: number) {
    return algosdk.getApplicationAddress(appIndex)
  }

  public getNote(asset: AssetNormalized, appIndex: number) {
    return algosdk.encodeObj({
      ...asset,
      arc69: {
        ...asset.arc69,
        properties: {
          ...asset.arc69.properties,
          app_id: appIndex,
        },
      },
    })
  }

  private get client() {
    return this.clientProvider.client
  }

  async createOptInRequest(
    assetId: number,
    sender: string = this.walletProvider.account.addr,
    recipient = sender,
    ammout = 0
  ) {
    const params = await this.client.getTransactionParams().do()
    const revocationTarget = undefined
    const closeRemainderTo = undefined
    const note = undefined
    const amount = ammout
    console.log(`[OPT IN]\nsender = ${sender}\nrecipient = ${recipient}`)
    return await algosdk.makeAssetTransferTxnWithSuggestedParams(
      sender,
      recipient,
      closeRemainderTo,
      revocationTarget,
      amount,
      note,
      assetId,
      params
    )
  }

  async optInAssetByID(
    assetId: number,
    sender: string = this.walletProvider.account.addr,
    recipient = sender,
    ammout = 0
  ) {
    return await this.createOptInRequest(
      assetId,
      sender,
      recipient,
      ammout
    )
  }

  async createGroupTxn(appIndex: number, assetId: number, asset: AssetNormalized) {
    
    const transactions: TransactionLike[] = []
    const optInTxnUnsigned = await this.optInAssetByID(assetId)
    transactions.push(optInTxnUnsigned)
    
    
    
    const appAddr = this.getApplicationAddressFromAppIndex(appIndex)
    this.logger.info(`App wallet is ${appAddr}`)
      
    const { amount, fundTxn } = await this.auctionLogic.fundListingWithoutConfirm(appIndex)
    transactions.push(fundTxn)
    this.logger.info(`Application funded with ${amount}`)
    const appCallTxn = await this.auctionLogic.makeAppCallSetupProcWithoutConfirm(appIndex, assetId)
    transactions.push(appCallTxn)
    const note = this.getNote(asset, appIndex)

    const makeTransferTransactions = await this.auctionLogic.makeTransferToAppWithoutConfirm(appIndex, assetId, note)
    if (Array.isArray(makeTransferTransactions) && makeTransferTransactions.length) transactions.push(...makeTransferTransactions)
    const txns = algosdk.assignGroupID(transactions)
    // const signedTxn = await this.signer.signTransaction(txns)
    // this.status.assetTransfer = {
    //   state: true
    // }
    this.logger.info(`Asset ${assetId} transferred to ${appIndex}`)
    return txns
  }


  async execute(db: DataSource, body: AuctionCreateAppData, asset: AssetNormalized): Promise<CreateListingResponse> {
    const note = asset.note
    this._avoidErrorMetadataQuantityOnBlockchain(asset)
    const appIndex = await this.createApp(
      body.assetId,
      asset,
      body.creatorWallet,
      body.startDate,
      body.endDate,
      db,
      note
    )
    this.logger.info(
      `DONE: Sending back the asset ${body.assetId} to wallet owner.`
    )

      // const transactions2: TransactionLike[] = []
      // const emptyGroupTxn = algosdk.assignGroupID(transactions2)

      const unsignedTxnGroup = await this.createGroupTxn(appIndex, body.assetId, asset)
      // await this.storeSellingData(db, body, asset, appIndex)


    return { appIndex, unsignedTxnGroup }

  }

  _avoidErrorMetadataQuantityOnBlockchain(asset: AssetNormalized) {
    delete asset.note
  }

  async createAuctionApp(
    assetId: number,
    reserve: number,
    asset: AssetNormalized,
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

    // this.logger.info(
    //   `Auction created by ${this.account.account.addr} is ${appIndex} ${config.algoExplorerApi}/application/${appIndex}`
    //   )
    
    return appIndex
  }

  async createApp(
    assetId: number,
    asset: AssetNormalized,
    creatorWallet: string,
    startDate: string,
    endDate: string,
    db: DataSource,
    note?: string
  ) {
    if (!asset?.arc69?.properties?.cause || !asset?.arc69?.properties?.price) {
      throw new Error('Nft must be minted in our marketplace, cause and price fields not present')
    }

    this.logger.info('Creating auction')
    const appIndex = await this.createAuctionApp(
      assetId,
      asset.arc69.properties.price,
      asset,
      creatorWallet,
      startDate,
      endDate
    )

    return appIndex
  }

}