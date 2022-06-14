import AlgodClientProvider from '@common/services/AlgodClientProvider'
import { AuctionLogic } from '@common/services/AuctionLogic'
import OptInService from '@common/services/OptInService'
import config from 'src/config/default'
import Container, { Inject, Service } from 'typedi'
import algosdk, { TransactionLike } from 'algosdk'
import * as WalletAccountProvider from '@common/services/WalletAccountProvider'
import { TransactionOperation } from '@common/services/TransactionOperation'
import CustomLogger from 'src/infrastructure/CustomLogger'
import { AssetNormalized } from 'src/interfaces'
import { RekeyData } from 'src/interfaces'
import TransactionGroupService from './TransactionGroupService'
import { DataSource } from 'typeorm'
import SellignsService from './SellingsService'

@Service()
export default class DirectListingService {
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
    this.sellingsService = Container.get(SellignsService)
    this.optInService = Container.get(OptInService)
    this.auctionLogic = Container.get(AuctionLogic)
    this.client = Container.get(AlgodClientProvider)
    this.account = WalletAccountProvider.get()
    this.op = Container.get(TransactionOperation)
  }

  async execute(
    transactionGroupService: TransactionGroupService,
    assetId: number,
    asset: AssetNormalized,
    creatorWallet: string,
    inputCausePercentage: number,
    db: DataSource,
  ) {
    this.transactionGroupService = transactionGroupService
    this.logger.info('Creating direct listing')
    const rekeyAccount = await this.sellingsService.generateRekeyAccount()
    const cause = await this.sellingsService.getCauseInfo(asset.arc69.properties.cause)
    const {
      causePercentage,
      creatorPercentage
    } = await this.sellingsService.calculatePercentages(inputCausePercentage)
    const appIndex = await this.createDirectListing(
      assetId,
      asset.arc69.properties.price,
      rekeyAccount,
      asset,
      cause.data.wallet,
      creatorWallet,
      causePercentage,
      creatorPercentage,
    )

    const data: RekeyData = {
      cause: asset.arc69.properties.cause,
      assetUrl: asset.image_url ?? '',
      isClosedAuction: false,
      appIndex,
      assetId,
      wallet: rekeyAccount.addr,
      type: 'direct-listing',
    }

    this.sellingsService.store(data, db)
    return {
      appIndex,
    }
  }

  async createDirectListing(
    assetId: number,
    reserve: number,
    rekeyAccount: algosdk.Account,
    asset: AssetNormalized,
    causeWallet: string,
    creatorWallet: string,
    causePercentage: number,
    creatorPercentage: number,
  ): Promise<number> {
    this.logger.info(`Creating directListing`)
    const directSell = await this.auctionLogic.createDirectListing(
      assetId,
      reserve,
      parseInt(config.bid.increment),
      rekeyAccount,
      causeWallet,
      creatorWallet,
      causePercentage,
      creatorPercentage,
    )
    this.status.application.state = true
    const appIndex = directSell['application-index']
    this.logger.info(
      `DirectSell created by ${rekeyAccount.addr} is ${appIndex} ${config.algoExplorerApi}/application/${appIndex}`
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
