import AlgodClientProvider from '@common/services/AlgodClientProvider'
import { AuctionLogic } from '@common/services/AuctionLogic'
import OptInService from '@common/services/OptInService'
import config from 'src/config/default'
import Container, { Inject, Service } from 'typedi'
import axios from 'axios'
import algosdk from 'algosdk'
import { appendFileSync } from 'fs'
import * as WalletAccountProvider from '@common/services/WalletAccountProvider'
import { TransactionOperation } from '@common/services/TransactionOperation'
import CustomLogger from 'src/infrastructure/CustomLogger'
import { AssetNormalized } from 'src/interfaces'
import ListEntity from '../domain/model/ListEntity'
import ListRepository from 'src/infrastructure/repositories/ListRepository'
import AssetRepository from 'src/infrastructure/repositories/AssetRepository'
import { DataSource } from 'typeorm'
import AssetEntity from 'src/domain/model/AssetEntity'
import AuctionEntity from 'src/domain/model/AuctionEntity'
import AuctionRepository from 'src/infrastructure/repositories/AuctionRepository'

@Service()
export default class SellignsService {
  readonly auctionLogic: AuctionLogic
  readonly optInService: OptInService
  readonly client: AlgodClientProvider
  readonly account: WalletAccountProvider.type
  readonly op: TransactionOperation
  @Inject()
  private readonly logger!: CustomLogger

  constructor() {
    this.optInService = Container.get(OptInService)
    this.auctionLogic = Container.get(AuctionLogic)
    this.client = Container.get(AlgodClientProvider)
    this.account = WalletAccountProvider.get()
    this.op = Container.get(TransactionOperation)
  }

  async store(data: any, db: DataSource) {
    const asset = await this._insertAsset(data)
    const assetRepo = db.getRepository(AssetEntity)
    const assetQuery =  new AssetRepository(assetRepo)
    console.log('.......', asset)
    const assetResult = await assetQuery.insert(asset).catch((error) => {
        this.logger.error(`Insert asset error: ${error.message}`, {stack: error.stack})
        throw error
    })
    console.log('............asset insert result', assetResult)
    let auctionResult
    if (data.startDate) {
      const auction = await this._insertAuction(data)
      const auctionRepo = db.getRepository(AuctionEntity)
      const auctionQuery =  new AuctionRepository(auctionRepo)
      auctionResult = await auctionQuery.insert(auction).catch((error) => {
          this.logger.error(`Insert list error: ${error.message}`, {stack: error.stack})
          throw error
      })
    }
    let list = await this._insertList(data, assetResult.id)
    if (auctionResult) list = await this._insertList(data, assetResult.id, auctionResult.id)
    const listRepo = db.getRepository(ListEntity)
    const listQuery =  new ListRepository(listRepo)
    await listQuery.insert(list).catch((error) => {
        this.logger.error(`Insert list error: ${error.message}`, {stack: error.stack})
        throw error
    })
  }
  _insertAsset(data: any) {
    const entity = new AssetEntity()
    entity.arc69 = data.asset.arc69
    entity.imageUrl = data.asset.image_url
    entity.ipnft = data.asset.ipnft
    entity.title = data.asset.title
    entity.url = data.asset.url
    entity.creator = data.asset.creator
    entity.assetIdBlockchain = data.asset.id
    entity.causeId = data.cause
    entity.applicationIdBlockchain = data.appIndex || 0

    return entity
  }
  _insertAuction(data: any) {
    const entity = new AuctionEntity()
    entity.startDate =  data.startDate || ''
    entity.endDate =  data.endDate || ''

    return entity
  }
  _insertList(data: any, assetId: string, auctionId?: string) {
    const entity = new ListEntity()
    entity.isClosed = data.isClosed
    entity.applicationIdBlockchain = data.appIndex || 0
    entity.assetIdBlockchain = data.assetId
    entity.marketplaceWallet = config.defaultWallet.address
    entity.assetId = assetId
    if (auctionId) entity.auctionId = auctionId
    return entity
  }

  public async calculatePercentages(inputCausePercentage: number) {
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

  async generateRekeyAccount() {
    const rekeyAccount = this._generateRekeyAccount()
    appendFileSync(
      '.temp.accounts',
      `${rekeyAccount.addr} ${algosdk.secretKeyToMnemonic(rekeyAccount.sk)}\n`
    )
    this.logger.info(`Dumping temporary account information:`, { rekeyAccountAddress: rekeyAccount.addr })
    this.logger.info(`Paying fees for temp ${rekeyAccount.addr}...`)
    await this._payMinimumTransactionFeesToRekeyAccount(rekeyAccount)
    this.logger.info(`Rekeying temporary account...`)
    const rekeyTransaction = await this._rekeyingTemporaryAccount(rekeyAccount)
    await this.op.signAndConfirm(rekeyTransaction, undefined, rekeyAccount)

    return rekeyAccount
  }

  public getApplicationAddressFromAppIndex(appIndex: number) {
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

  async getCauseInfo(causeId: string) {
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
