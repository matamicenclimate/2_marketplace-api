import AlgodClientProvider from '@common/services/AlgodClientProvider'
import { AuctionLogic } from '@common/services/AuctionLogic'
import OptInService from '@common/services/OptInService'
import config from 'src/config/default'
import Container, { Inject, Service } from 'typedi'
import axios from 'axios'
import algosdk, { TransactionLike } from 'algosdk'
import { appendFileSync } from 'fs'
import * as WalletAccountProvider from '@common/services/WalletAccountProvider'
import { TransactionOperation } from '@common/services/TransactionOperation'
import CustomLogger from 'src/infrastructure/CustomLogger'
import { AssetNormalized } from 'src/interfaces'
import { RekeyData } from 'src/interfaces'
import RekeyAccountRecord from '../domain/model/RekeyAccount'
import RekeyRepository from 'src/infrastructure/repositories/RekeyRepository'
import { DataSource } from 'typeorm'
import TransactionGroupService from './TransactionGroupService'

@Service()
export default class AuctionService {
  readonly auctionLogic: AuctionLogic
  readonly optInService: OptInService
  readonly client: AlgodClientProvider
  readonly account: WalletAccountProvider.type
  readonly op: TransactionOperation
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
    this.transactionGroupService = transactionGroupService
    this.logger.info('Creating auction')
    const rekeyAccount = await this.generateRekeyAccount()
    const cause = await this._getCauseInfo(asset.arc69.properties.cause)
    const {
      causePercentage,
      creatorPercentage
    } = await this._calculatePercentages(inputCausePercentage)
    const appIndex = await this.createAuction(
      assetId,
      asset.arc69.properties.price,
      rekeyAccount,
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
      wallet: rekeyAccount.addr,
      startDate,
      endDate,
      type: 'create-auction'
    }

    const rekey = await this._insertRekey(data)
    const repo = db.getRepository(RekeyAccountRecord)
    const query =  new RekeyRepository(repo)
    await query.insert(rekey).catch((error) => {
        this.logger.error(`Insert rekey error: ${error.message}`, error.stack)
        throw error
    })

    return {
      appIndex,
    }
  }

  _insertRekey(data: RekeyData) {
    const rekey = new RekeyAccountRecord()
    rekey.assetUrl = data.assetUrl
    rekey.cause = data.cause
    rekey.isClosedAuction = data.isClosedAuction
    rekey.applicationId = data.appIndex | 0
    rekey.assetId = data.assetId
    rekey.rekeyWallet = data.wallet
    rekey.marketplaceWallet = config.defaultWallet.address
    rekey.auctionStartDate = data.startDate || ''
    rekey.auctionEndDate = data.endDate || ''
    rekey.type = data.type
    return rekey
  }

  async createAuction(
    assetId: number,
    reserve: number,
    rekeyAccount: algosdk.Account,
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
      rekeyAccount,
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
      `Auction created by ${rekeyAccount.addr} is ${appIndex} ${config.algoExplorerApi}/application/${appIndex}`
      )
      const appAddr = this._getApplicationAddressFromAppIndex(appIndex)
      this.logger.info(`App wallet is ${appAddr}`)
      
    const transactions: TransactionLike[] = []
    const { amount, fundTxn } = await this.auctionLogic.fundListingWithoutConfirm(appIndex)
    transactions.push(fundTxn)
    this.logger.info(`Application funded with ${amount}`)
    const appCallTxn = await this.auctionLogic.makeAppCallSetupProcWithoutConfirm(appIndex, assetId)
    transactions.push(appCallTxn)
    const note = algosdk.encodeObj({
      ...asset,
      arc69: {
        ...asset.arc69,
        properties: {
          ...asset.arc69.properties,
          app_id: appIndex,
        },
      },
    })
    const makeTransferTransactions = await this.auctionLogic.makeTransferToAppWithoutConfirm(appIndex, assetId, note)
    if (Array.isArray(makeTransferTransactions) && makeTransferTransactions.length) transactions.push(...makeTransferTransactions)
    await this.transactionGroupService.execute(transactions)
    this.status.assetTransfer = {
      state: true
    }
    this.logger.info(`Asset ${assetId} transferred to ${appIndex}`)

    return appIndex
  }

  private async _calculatePercentages(inputCausePercentage: number) {
    const HUNDRED_PERCENT = 100
    let causePercentage = inputCausePercentage
    const percentages = await this._getCausesPercentages()
    const causeP = percentages.data.percentages.cause
    if (causeP > causePercentage) {
      causePercentage = causeP
    }
    const creatorPercentage = HUNDRED_PERCENT - causePercentage - percentages.data.percentages.marketplace

    return {
      causePercentage,
      creatorPercentage
    }
  }

  async generateRekeyAccount() {
    const rekeyAccount = this._generateRekeyAccount()
    appendFileSync(
      '.temp.accounts',
      `${rekeyAccount.addr} ${algosdk.secretKeyToMnemonic(rekeyAccount.sk)}\n`
    )
    this.logger.info(`Dumping temporary account information:`, { rekeyAccountAddress: rekeyAccount.addr })
    this.logger.info(`Paying fees for temp ${rekeyAccount.addr}...`)
    await this._payMinimumTransactionFeesToRekeyAccount(rekeyAccount)
    this.status.rekey.state = true
    this.status.rekey.account = rekeyAccount.addr
    this.logger.info(`Rekeying temporary account...`)
    const rekeyTransaction = await this._rekeyingTemporaryAccount(rekeyAccount)
    await this.op.signAndConfirm(rekeyTransaction, undefined, rekeyAccount)

    return rekeyAccount
  }

  private _getApplicationAddressFromAppIndex(appIndex: number) {
    return algosdk.getApplicationAddress(appIndex)
  }

  async _rekeyingTemporaryAccount(rekeyAccount: algosdk.Account) {
    const suggestedParams: algosdk.SuggestedParams =
      await this._getSuggestedParams()

    return await algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: rekeyAccount.addr,
      to: rekeyAccount.addr,
      suggestedParams,
      amount: 0,
      rekeyTo: this.account.account.addr,
    })
  }

  private async _payMinimumTransactionFeesToRekeyAccount(
    rekeyAccount: algosdk.Account
  ) {
    const microAlgosForFees = 1000000
    await this.op.pay(
      this.account.account,
      rekeyAccount.addr,
      microAlgosForFees
    )
  }
  private _generateRekeyAccount() {
    return algosdk.generateAccount()
  }
  private async _getSuggestedParams() {
    return await this.client.client.getTransactionParams().do()
  }

  async _getCauseInfo(causeId: string) {
    this.logger.info(`getting causes info.... causeId ${config.apiUrlCauses}causes/${causeId}`)
    const cause = await axios.get(
      `${config.apiUrlCauses}/causes/${causeId}`,
      {
        headers: {
          accept: 'application/json',
        },
      }
    )

    return cause
  }

  async _getCausesPercentages() {
    this.logger.info('getting causes percentages....')
    const percentages = await axios.get(
      `${config.apiUrlCauses}/causes/config`,
      {
        headers: {
          accept: 'application/json',
        },
      }
    )

    return percentages
  }
}
