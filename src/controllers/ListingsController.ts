import { Get, JsonController, Param, QueryParam } from 'routing-controllers'
import { Inject, Service } from 'typedi'
import FindByQueryService from '../services/list/FindByQueryService'
import AssetFindByQueryService from '../services/asset/FindByQueryService'
import AssetFindAllByQueryService from '../services/asset/FindAllByQueryService'
import UpdateAssetService from '../services/asset/UpdateAssetService'
import ListingService from '../services/ListingService'
import DbConnectionService from 'src/services/DbConnectionService'
import ServiceException from '../infrastructure/errors/ServiceException'
import CustomLogger from '../infrastructure/CustomLogger'
import config from '../config/default'
import { Response } from '@common/lib/api'
import { core } from '@common/lib/api/endpoints'
import { AssetNormalized } from 'src/interfaces'
import AssetEntity from 'src/domain/model/AssetEntity'
import { In } from 'typeorm'
import { Asset } from '@common/lib/api/entities'

@Service()
@JsonController('/api')
export default class ListingsController {
  @Inject()
  readonly listingService: ListingService
  @Inject()
  readonly findByQueryService: FindByQueryService
  @Inject()
  readonly updateAssetService: UpdateAssetService
  @Inject()
  readonly assetFindByQueryService: AssetFindByQueryService
  @Inject()
  readonly assetFindAllByQueryService: AssetFindAllByQueryService
  @Inject()
  private readonly logger!: CustomLogger

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
        const assetInDB = await this.assetFindByQueryService.execute({ assetIdBlockchain: id})
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
  @Get(`/${config.version}/asset-info/:id`)
  async getAssetInfo(
    @Param('id') id: number
  ): Promise<Response<core['get']['asset-info/:id']>> {
    try {
      const assets = await this.findByQueryService.execute({ assetIdBlockchain: id })
      return assets[0]
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

      return {assets: []}
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
      const assetsInBlockchain = await this.listingService.getMyAssetsFromWallet(wallet)
      const result = await this._mapWithDatabaseExistentAssets(assetsInBlockchain.assets)
      return {
        assets: result
      }
    } catch (error) {
      const message = `Get assets from wallet error: ${error.message}`
      this.logger.error(message, { stack: error.stack })
      throw new ServiceException(message)
    }
  }

  _prepareAssetToUpdate(assetNormalized: AssetNormalized) {
    const { id: _, image_url, ...fields } = assetNormalized
    const immediate = { ...fields, imageUrl: image_url }
    type AssetImmediate = typeof immediate

    return immediate as AssetImmediate & Partial<Omit<AssetEntity, keyof AssetImmediate>>
  }

  async _mapWithDatabaseExistentAssets(assetsInBlockchain: Asset[]) {
    if (Array.isArray(assetsInBlockchain)) {
      const assetIds = assetsInBlockchain.map(i => i['asset-id'])
        const assets = await this.assetFindAllByQueryService.execute({assetIdBlockchain: In(assetIds)})
        const assetsInDBMap = assets.reduce((acc, item) => {
          acc[item.assetIdBlockchain] = item
          return acc
        }, {} as Record<number, AssetEntity>)
        return assetsInBlockchain.map(i => {
          if (assetsInDBMap[i['asset-id']]) return assetsInDBMap[i['asset-id']]
          return i
        })
    }
    return []
  }
}
