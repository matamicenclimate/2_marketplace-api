import AlgodClientProvider from '@common/services/AlgodClientProvider'
import { AuctionLogic } from '@common/services/AuctionLogic'
import OptInService from '@common/services/OptInService'
import config from '../config/default'
import Container, { Inject, Service } from 'typedi'
import axios from 'axios'
import algosdk from 'algosdk'
import { appendFileSync } from 'fs'
import * as WalletAccountProvider from '@common/services/WalletAccountProvider'
import { TransactionOperation } from '@common/services/TransactionOperation'
import CustomLogger from '../infrastructure/CustomLogger'
import { AssetNormalized, SellingData } from '../interfaces'
import ListEntity from '../domain/model/ListEntity'
import ListRepository from '../infrastructure/repositories/ListRepository'
import AssetRepository from '../infrastructure/repositories/AssetRepository'
import { DataSource, EntityTarget } from 'typeorm'
import AssetEntity from '../domain/model/AssetEntity'
import AuctionEntity from '../domain/model/AuctionEntity'
import AuctionRepository from '../infrastructure/repositories/AuctionRepository'
import FindByQueryService from './list/FindByQueryService'

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

  async store(data: SellingData, db: DataSource) {
    const assetStored = await this._storeAsset(data, db)
    const auctionStored = await this._storeAuction(data, db)    
    if (auctionStored) {
      await this._storeList(data, db, assetStored.id, auctionStored.id)
    } else {
      await this._storeList(data, db, assetStored.id)
    }
  }

  async _storeAsset (data: SellingData, db: DataSource) {
    const assets = await (new FindByQueryService()).execute({assetIdBlockchain: data.asset.id})
    if (Array.isArray(assets) && assets.length) {
      return this._ensureAssetHasOnlyOneRegisteredAssetWithSameAssetIdBlockchain(assets[0])
    } else {
      const asset = await this._insertAsset(data)
      return this.storeDatabaseEntity(db, AssetEntity, AssetRepository, asset)
    }
  }

  _ensureAssetHasOnlyOneRegisteredAssetWithSameAssetIdBlockchain (listing: ListEntity) {
      return listing.asset
  }

  async _storeAuction (data: SellingData, db: DataSource) {
    if (data.startDate) {
      const auction = await this._insertAuction(data)
      return this.storeDatabaseEntity(db, AuctionEntity, AuctionRepository, auction)
    }
  }
  async _storeList (data: SellingData, db: DataSource, assetId: string, auctionId?: string) {
    let list = await this._insertList(data, assetId, auctionId)
    this.storeDatabaseEntity(db, ListEntity, ListRepository, list)
  }

  async storeDatabaseEntity (db: DataSource, entityClass: EntityTarget<unknown>, Repo: any, data: any) {
    const repo = db.getRepository(entityClass)
    const query =  new Repo(repo)
    return await query.insert(data).catch((error: Error) => {
        this.logger.error(`Insert list error: ${error.message}`, {stack: error.stack})
        throw error
    })
  }
  _insertAsset(data: SellingData) {
    const entity = new AssetEntity()
    entity.arc69 = data.asset.arc69
    entity.imageUrl = data.asset.image_url
    entity.ipnft = data.asset.ipnft
    entity.title = data.asset.title
    entity.url = data.asset.url
    entity.creator = data.asset.creator
    entity.assetIdBlockchain = data.asset.id
    entity.causeId = data.cause
    entity.note = data.asset.note
    entity.applicationIdBlockchain = data.appIndex || 0

    return entity
  }
  _insertAuction(data: SellingData) {
    const entity = new AuctionEntity()
    entity.startDate =  data.startDate || ''
    entity.endDate =  data.endDate || ''

    return entity
  }
  _insertList(data: SellingData, assetId: string, auctionId?: string) {
    const entity = new ListEntity()
    entity.isClosed = data.isClosed || false
    entity.applicationIdBlockchain = data.appIndex || 0
    entity.assetIdBlockchain = data.assetId
    entity.marketplaceWallet = config.defaultWallet.address
    entity.assetId = assetId
    entity.price = data.asset.arc69.properties.price
    if (auctionId) {
      entity.auctionId = auctionId
      entity.type = 'auction'
    } else {
      entity.type = 'direct-listing'
    }
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
    this.logger.info(`getting causes info ${config.apiUrlCauses}causes/${causeId}`)
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
    this.logger.info('getting causes percentages')
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
