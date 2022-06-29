import { Get, JsonController, Param, QueryParam } from 'routing-controllers'
import { Inject, Service } from 'typedi'
import FindByQueryService from '../services/FindByQueryService'
import ListingService from '../services/ListingService'
import DbConnectionService from 'src/services/DbConnectionService'
import ServiceException from '../infrastructure/errors/ServiceException'
import CustomLogger from '../infrastructure/CustomLogger'
import config from '../config/default'
import { Response } from '@common/lib/api'
import { core } from '@common/lib/api/endpoints'
import { AssetNormalized } from 'src/interfaces'

@Service()
@JsonController('/api')
export default class ListingsController {
  @Inject()
  readonly ListingService: ListingService
  @Inject()
  readonly findByQueryService: FindByQueryService
  @Inject()
  private readonly logger!: CustomLogger

  /** @deprecated */
  @Get(`/${config.version}/nfts`)
  async listing(): Promise<Response<core['get']['nfts']>> {
    try {
      const assets: AssetNormalized[] = []
      for await (const result of this.ListingService.list()) {
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
      const result = await this.ListingService.getAsset(id)
      if (result.isDefined()) {
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
      const assets = await this.ListingService.getAssetsFromWallet(wallet, db)
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
      return await this.ListingService.getMyAssetsFromWallet(wallet)
    } catch (error) {
      const message = `Get assets from wallet error: ${error.message}`
      this.logger.error(message, { stack: error.stack })
      throw new ServiceException(message)
    }
  }
}
