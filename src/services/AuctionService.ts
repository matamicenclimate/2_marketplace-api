import AlgodClientProvider from '@common/services/AlgodClientProvider'
import { AuctionLogic } from '@common/services/AuctionLogic'
import OptInService from '@common/services/OptInService'
import config from 'src/config/default'
import Container, { Inject, Service } from 'typedi'
import { TransactionLike } from 'algosdk'
import * as WalletAccountProvider from '@common/services/WalletAccountProvider'
import { TransactionOperation } from '@common/services/TransactionOperation'
import CustomLogger from 'src/infrastructure/CustomLogger'
import { AssetNormalized } from 'src/interfaces'
import { RekeyData } from 'src/interfaces'
import { DataSource } from 'typeorm'
import TransactionGroupService from './TransactionGroupService'
import SellignsService from './SellingsService'



@Service()
export default class AuctionService {
  readonly auctionLogic: AuctionLogic
  readonly optInService: OptInService
  readonly client: AlgodClientProvider
  readonly account: WalletAccountProvider.type
  readonly op: TransactionOperation
  readonly sellingsService: SellignsService
  private transactionGroupService: TransactionGroupService
  @Inject()
  private readonly logger!: CustomLogger
  public status = {
    rekey: {
      account: '',
      state: false,
    }, 
    assetTransfer: {
      state: false
    }, 
    application: {
      state: false
    }
  }
  
  constructor() {
    this.optInService = Container.get(OptInService)
    this.auctionLogic = Container.get(AuctionLogic)
    this.client = Container.get(AlgodClientProvider)
    this.account = WalletAccountProvider.get()
    this.op = Container.get(TransactionOperation)
    this.sellingsService = Container.get(SellignsService)
  }

  async execute(
    transactionGroupService: TransactionGroupService,
    assetId: number,
    asset: AssetNormalized,
    creatorWallet: string,
    inputCausePercentage: number,
    startDate: string,
    endDate: string,
    db: DataSource,
  ) {
    if (!asset?.arc69?.properties?.cause || !asset?.arc69?.properties?.price) {
      throw new Error('Nft must be minted in our marketplace, cause and price fields not present')
    }
    this.transactionGroupService = transactionGroupService
    this.logger.info('Creating auction')
    const cause = await this.sellingsService.getCauseInfo(asset.arc69.properties.cause)
    const {
      causePercentage,
      creatorPercentage
    } = await this.sellingsService.calculatePercentages(inputCausePercentage)
    const appIndex = await this.createAuction(
      assetId,
      asset.arc69.properties.price,
      asset,
      cause.data.wallet,
      creatorWallet,
      causePercentage,
      creatorPercentage,
      startDate,
      endDate,
    )

    const data: RekeyData = {
      cause: asset.arc69.properties.cause,
      assetUrl: asset.image_url ?? '',
      isClosedAuction: false,
      appIndex,
      assetId,
      wallet: this.account.account.addr,
      startDate,
      endDate,
      type: 'create-auction'
    }

    this.sellingsService.store(data, db)

    return {
      appIndex,
    }
  }

  async createAuction(
    assetId: number,
    reserve: number,
    asset: AssetNormalized,
    causeWallet: string,
    creatorWallet: string,
    causePercentage: number,
    creatorPercentage: number,
    startDate: string,
    endDate: string
  ): Promise<number> {
    this.logger.info(`Creating auction`)
    const auction = await this.auctionLogic.createAuction(
      assetId,
      reserve,
      parseInt(config.bid.increment),
      causeWallet,
      creatorWallet,
      causePercentage,
      creatorPercentage,
      startDate,
      endDate
      )
    this.status.application.state = true
    const appIndex = auction['application-index']
    this.logger.info(
      `Auction created by ${this.account.account.addr} is ${appIndex} ${config.algoExplorerApi}/application/${appIndex}`
      )
    const appAddr = this.sellingsService.getApplicationAddressFromAppIndex(appIndex)
    this.logger.info(`App wallet is ${appAddr}`)
      
    const transactions: TransactionLike[] = []
    const { amount, fundTxn } = await this.auctionLogic.fundListingWithoutConfirm(appIndex)
    transactions.push(fundTxn)
    this.logger.info(`Application funded with ${amount}`)
    const appCallTxn = await this.auctionLogic.makeAppCallSetupProcWithoutConfirm(appIndex, assetId)
    transactions.push(appCallTxn)
    const note = this.sellingsService.getNote(asset, appIndex)

    const makeTransferTransactions = await this.auctionLogic.makeTransferToAppWithoutConfirm(appIndex, assetId, note)
    if (Array.isArray(makeTransferTransactions) && makeTransferTransactions.length) transactions.push(...makeTransferTransactions)
    await this.transactionGroupService.execute(transactions)
    this.status.assetTransfer = {
      state: true
    }
    this.logger.info(`Asset ${assetId} transferred to ${appIndex}`)

    return appIndex
  }
}
