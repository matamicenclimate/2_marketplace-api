import config from '../config/default'
import { Inject, Service } from 'typedi'
import * as WalletAccountProvider from '@common/services/WalletAccountProvider'
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
import { AuctionAppState } from '@common/lib/types'

@Service()
export default class storeListingService {
  readonly walletProvider: WalletAccountProvider.type
  @Inject()
  private readonly logger!: CustomLogger

  constructor() {
    this.walletProvider = WalletAccountProvider.get()
  }

  prepareSellingData(state: AuctionAppState, asset: AssetNormalized, appIndex: number) {
    return {
      asset,
      cause: asset.arc69.properties.cause,
      assetUrl: asset.image_url ?? '',
      isClosed: false,
      appIndex,
      assetId: asset.id,
      wallet: this.walletProvider.account.addr,
      startDate: this.scDateToISOString(state.start),
      endDate: this.scDateToISOString(state.end)
    }
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

  private scDateToISOString(date: number) {
    return new Date(date * 1000).toISOString()
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
}
