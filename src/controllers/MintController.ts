import { Body, JsonController, Param, Post } from 'routing-controllers'
import Container, { Inject, Service } from 'typedi'
import OptInService from '@common/services/OptInService'
import AuctionService from '../services/AuctionService'
import config from '../config/default'
import { OpenAPI } from 'routing-controllers-openapi'
import ListingService from 'src/services/ListingService'
import CustomLogger from 'src/infrastructure/CustomLogger'
import ServiceException from 'src/infrastructure/errors/ServiceException'
import * as WalletAccountProvider from '@common/services/WalletAccountProvider'
import { AssetNormalized } from 'src/interfaces'
import { option } from '@octantis/option'
import { Response } from '@common/lib/api'
import { core } from '@common/lib/api/endpoints'

@Service()
@JsonController('/api')
export default class MintController {
  @Inject()
  readonly optInService: OptInService

  @Inject()
  readonly auctionService: AuctionService

  @Inject()
  readonly listingService: ListingService

  @Inject()
  private readonly logger!: CustomLogger

  @WalletAccountProvider.inject()
  private readonly wallet!: WalletAccountProvider.type

  @Post(`/${config.version}/create-auction`)
  async createAuction(@Body() {
    assetId,
    creatorWallet,
    causePercentaje,
  }: { assetId: number, creatorWallet: string, causePercentaje: string }): Promise<Response<core['post']['create-auction']>> {
    try {
      const populatedAsset = await this.listingService.populateAsset(assetId)
      const asset: option<AssetNormalized> =
        await this.listingService.normalizeAsset(populatedAsset)
      if (asset.isDefined()) {
        const response = await this.auctionService.execute(assetId, asset.value, creatorWallet, causePercentaje)
        this.logger.info(`DONE: Sending back the asset ${assetId} to wallet owner.`)
        return response
      }

      throw new ServiceException(`Create auction error: Asset ${assetId} not found`)
    } catch (error) {
      const message = `Create auction error: ${error.message}`
      this.logger.error(message, { stack: error.stack })
      throw new ServiceException(message)
    }
  }

  @OpenAPI({
    description:
      'Creates a new assets (opts-in the asset) in the marketplace account.',
    responses: {
      200: 'The asset was opted in successfully, returns information about the transaction.',
      500: 'Unexpected internal error, contact support.',
      400: 'Missing (Or wrong/ill formatted) asset ID parameter.',
    },
  })
  @Post(`/${config.version}/opt-in`)
  async optIn(@Body() body: any): Promise<Response<core['post']['opt-in']>> {
    try {
      const assetId = body.assetId
      await this.optInService.optInAssetByID(assetId)
      const populatedAsset = await this.listingService.populateAsset(assetId)
      const asset: option<AssetNormalized> =
        await this.listingService.normalizeAsset(populatedAsset)
      this.logger.info('Opt in result=', { asset: asset.isDefined() ? asset.value : undefined })
      return {
        targetAccount: (await this.wallet.account).addr,
      }
    } catch (error) {
      const message = `Opt in error: ${error.message}`
      this.logger.error(message, { stack: error.stack })
      throw new ServiceException(message)
    }
  }
}

