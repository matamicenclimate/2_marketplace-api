import {
  Get,
  Post,
  JsonController,
  Param,
  QueryParam,
  Body,
} from 'routing-controllers'
import Container, { Inject, Service } from 'typedi'
import FindByQueryService from '../services/list/FindByQueryService'
import AssetFindByQueryService from '../services/asset/FindByQueryService'
import AssetFindAllByQueryService from '../services/asset/FindAllByQueryService'
import UpdateAssetService from '../services/asset/UpdateAssetService'
import ListingService from '../services/ListingService'
import StoreListingService from '../services/StoreListingService'
import DbConnectionService from '../services/DbConnectionService'
import ServiceException from '../infrastructure/errors/ServiceException'
import CustomLogger from '../infrastructure/CustomLogger'
import config from '../config/default'
import { Response, Body as BodyCommon } from '@common/lib/api'
import { core } from '@common/lib/api/endpoints'
import { AssetNormalized } from '../interfaces'
import AssetEntity from '../domain/model/AssetEntity'
import { In } from 'typeorm'
import {
  Asset,
  AssetInformation,
  AssetInformationType,
  ListedAsAuctionAssetInfo,
  ListedAsSellingAssetInfo,
  Listing,
  StoredInWalletAssetInfo,
} from '@common/lib/api/entities'
import { Option } from '@octantis/option'
import { TransactionOperation } from '@common/services/TransactionOperation'
import { AuctionAppState } from '@common/lib/types'
import { HttpError } from 'koa'

@Service()
@JsonController('/api')
export default class ListingsController {
  @Inject()
  readonly listingService: ListingService
  @Inject()
  readonly findByQueryService: FindByQueryService
  @Inject()
  readonly storeListingService: StoreListingService
  @Inject()
  readonly updateAssetService: UpdateAssetService
  @Inject()
  readonly assetFindByQueryService: AssetFindByQueryService
  @Inject()
  readonly assetFindAllByQueryService: AssetFindAllByQueryService
  @Inject()
  private readonly logger!: CustomLogger
  readonly transactionOperation = Container.get(TransactionOperation)

  /** @deprecated */
  @Get(`/${config.version}/nfts`)
  async listing(): Promise<Response<core['get']['nfts']>> {
    try {
      const assets: AssetNormalized[] = []
      for await (const result of this.listingService.list()) {
        for (const asset of result) {
          assets.push(asset)
        }
      }
      return assets
    } catch (error) {
      const message = `Listing error: ${error.message}`
      this.logger.error(message, { stack: error.stack })
      throw new ServiceException(message)
    }
  }

  @Get(`/${config.version}/asset/:id`)
  async getAsset(
    @Param('id') id: number
  ): Promise<Response<core['get']['asset/:id']>> {
    try {
      const result = await this.listingService.getAsset(id)
      if (result.isDefined()) {
        const assetInDB = await this.assetFindByQueryService.execute({
          assetIdBlockchain: id,
        })
        if (assetInDB.note !== result.value.note) {
          const updatedAsset = this._prepareAssetToUpdate(result.value)
          await this.updateAssetService.execute(id, updatedAsset)
        }
        return result
      }

      throw new ServiceException(`Asset ${id} not found`)
    } catch (error) {
      const message = `Get asset error: ${error.message}`
      this.logger.error(message, { stack: error.stack })
      throw new ServiceException(message)
    }
  }
  @Get(`/${config.version}/listing/:id`)
  async getListing(
    @Param('id') id: number
  ): Promise<Response<core['get']['listing/:id']>> {
    try {
      await this._updateAssetInDatabase(id)
      const db = await DbConnectionService.create()
      const result = await this.listingService.getListing(id, db)
      if (result.isDefined()) {
        return result.value
      }
      throw new ServiceException(`Asset ${id} not found`)
    } catch (error) {
      const message = `Get asset error: ${error.message}`
      this.logger.error(message, { stack: error.stack })
      throw new ServiceException(message)
    }
  }
  @Get(`/${config.version}/asset-info/:id`)
  async getAssetInfo(
    @Param('id') id: number
  ): Promise<Response<core['get']['asset-info/:id']>> {
    try {
      const assets = await this.findByQueryService.execute({
        assetIdBlockchain: id,
      })
      return assets.reverse()[0]
    } catch (error) {
      const message = `Get asset from database error: ${error.message}`
      this.logger.error(message, { stack: error.stack })
      throw new ServiceException(message)
    }
  }
  @Get(`/${config.version}/assets`)
  async getAssetsFromWallet(
    @QueryParam('wallet') wallet?: string
  ): Promise<Response<core['get']['assets']>> {
    try {
      const db = await DbConnectionService.create()
      const assets = await this.listingService.getAssetsFromWallet(wallet, db)
      if (assets.isDefined()) {
        return { assets: assets.value }
      }

      return { assets: [] }
    } catch (error) {
      const message = `Get assets from wallet error: ${error.message}`
      this.logger.error(message, { stack: error.stack })
      throw new ServiceException(message)
    }
  }
  @Get(`/${config.version}/my-assets`)
  async getMyAssetsFromWallet(
    @QueryParam('wallet') wallet?: string
  ): Promise<Response<core['get']['my-assets']>> {
    try {
      if (wallet == null) {
        const err = new HttpError(
          "No wallet provided, this endpoint is meant to be used with user's wallet."
        )
        err.statusCode = 400
        throw err
      }
      const assetsInBlockchain =
        await this.listingService.getMyAssetsFromWallet(wallet)
      const result = await this._mapWithDatabaseExistentAssets(
        assetsInBlockchain.assets
      )
      return {
        assets: result,
      }
    } catch (error) {
      const message = `Get assets from wallet error: ${error.message}`
      this.logger.error(message, { stack: error.stack })
      throw new ServiceException(message)
    }
  }

  @Post(`/${config.version}/create-listing`)
  async createListing(
    @Body() body: BodyCommon<core['post']['create-listing']>
  ): Promise<Response<core['post']['create-listing']>> {
    try {
      // create app
      const populatedAsset = await this.listingService.populateAsset(
        body.assetId
      )
      const asset: Option<AssetNormalized> =
        await this.listingService.normalizeAsset(populatedAsset)
      if (asset.isDefined()) {
        const strategy = await this.listingService.createAppStrategy(
          body.type,
          body.causePercentage,
          asset.value.arc69.properties.cause
        )
        return await strategy.execute(body, asset.value)
      } else {
        throw new ServiceException(
          `Create Listing error: Asset ${body.assetId} not found`
        )
      }
    } catch (error) {
      const message = `Create Listing error: ${error.message}`
      this.logger.error(message, { stack: error.stack })
      throw new ServiceException(message)
    }
  }

  @Post(`/${config.version}/finish-create-listing`)
  async finishCreateListing(
    @Body() body: BodyCommon<core['post']['finish-create-listing']>
  ): Promise<Response<core['post']['finish-create-listing']>> {
    try {
      const strategy = await this.listingService.finishListingStrategy(body)
      await strategy.execute()

      const db = await DbConnectionService.create()
      const state = (await this.transactionOperation.getApplicationState(
        body.appIndex
      )) as AuctionAppState
      const populatedAsset = await this.listingService.populateAsset(
        state.nft_id
      )
      const asset: Option<AssetNormalized> =
        await this.listingService.normalizeAsset(populatedAsset)
      if (asset.isDefined()) {
        const data =
          body.type === 'auction'
            ? this.storeListingService.prepareAuctionSellingData(
                state,
                asset.value,
                body.appIndex
              )
            : this.storeListingService.prepareDirectListingSellingData(
                state,
                asset.value,
                body.appIndex
              )
        await this.storeListingService.store(data, db)
      }

      return {
        appIndex: body.appIndex,
      }
    } catch (error) {
      const message = `Create Listing error: ${error.message}`
      this.logger.error(message, { stack: error.stack })
      throw new ServiceException(message)
    }
  }

  _prepareAssetToUpdate(assetNormalized: AssetNormalized) {
    const { id: _, image_url, ...fields } = assetNormalized
    const immediate = { ...fields, imageUrl: image_url }
    type AssetImmediate = typeof immediate

    return immediate as AssetImmediate &
      Partial<Omit<AssetEntity, keyof AssetImmediate>>
  }

  async _updateAssetInDatabase(id: number) {
    const result = await this.listingService.getAsset(id)
    if (result.isDefined()) {
      const assetInDB = await this.assetFindByQueryService.execute({
        assetIdBlockchain: id,
      })
      if (assetInDB.note !== result.value.note) {
        const updatedAsset = this._prepareAssetToUpdate(result.value)
        await this.updateAssetService.execute(id, updatedAsset)
      }
    }
  }

  async _mapWithDatabaseExistentAssets(
    assetsInBlockchain: Asset[]
  ): Promise<AssetInformation[]> {
    const die: (msg: string) => never = (msg: string) => {
      throw new Error(msg)
    }
    const db = await DbConnectionService.create()
    const assetIds = assetsInBlockchain.map(i => i['asset-id'])
    const listingEntities = await this.listingService
      .getAssetsFromWallet(undefined, db)
      .then(r => r.get())
    const assets = await this.assetFindAllByQueryService.execute({
      assetIdBlockchain: In(assetIds),
    })
    const assetById = assets.reduce((acc, item) => {
      acc[item.assetIdBlockchain] = {
        asset: item,
        listing: listingEntities.find(
          e => e.assetIdBlockchain === item.assetIdBlockchain
        ),
      }
      return acc
    }, {} as Record<number, { asset: AssetEntity; listing?: Listing }>)
    return assetsInBlockchain.map(asset => {
      const { 'asset-id': id } = asset
      if (id in assetById) {
        const { asset: _original, listing } = assetById[id]
        if (listing != null) {
          if (listing.type === 'auction') {
            return {
              id,
              type: AssetInformationType.LISTED_AS_AUCTION,
              arc69: _original.arc69,
              causeId: _original.causeId,
              applicationIdBlockchain: _original.applicationIdBlockchain,
              imageUrl: _original.imageUrl,
              ipnft: _original.ipnft,
              url: _original.url,
              title: _original.title,
              creator: _original.creator,
              createdAt: _original.createdAt,
              updatedAt: _original.updatedAt,
              deletedAt: _original.deletedAt ?? null,
              _original,
            }
          } else {
            return {
              id,
              type: AssetInformationType.LISTED_AS_SELLING,
              arc69: _original.arc69,
              causeId: _original.causeId,
              applicationIdBlockchain: _original.applicationIdBlockchain,
              imageUrl: _original.imageUrl,
              ipnft: _original.ipnft,
              url: _original.url,
              title: _original.title,
              creator: _original.creator,
              createdAt: _original.createdAt,
              updatedAt: _original.updatedAt,
              deletedAt: _original.deletedAt ?? null,
              _original,
            }
          }
        }
      }
      return {
        id,
        type: AssetInformationType.STORED_IN_WALLET,
        amount: asset.amount ?? -1,
        _original: asset,
      }
    })
  }
}
