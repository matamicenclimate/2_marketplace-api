import { Body, JsonController, Param, Post } from 'routing-controllers'
import { Inject, Service } from 'typedi'
import OptInService from '@common/services/OptInService'
import AuctionService from '../services/AuctionService'
import config from '../config/default'
import { OpenAPI } from 'routing-controllers-openapi'
import ListingService from 'src/services/ListingService'
import { AssetNote } from '@common/lib/AssetNote'
import CustomLogger from 'src/infrastructure/CustomLogger'
import ServiceException from 'src/infrastructure/errors/ServiceException'

// ONLY DEV - Prints swagger json
// import { getMetadataArgsStorage } from 'routing-controllers'
// import { routingControllersToSpec } from 'routing-controllers-openapi'
// import util from 'util'

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
  async optIn(@Body() body: any) {
    try {
      const assetId = body.assetId
      await this.optInService.optInAssetByID(assetId)
      const populatedAsset = await this.listingService.populateAsset(assetId)
      const asset: AssetNote =
        this.listingService.normalizeAsset(populatedAsset)
      const response = await this.auctionService.execute(
        assetId,
        asset?.arc69?.properties?.price
      )
      return response
    } catch (error) {
      console.log(error.message, error.stack)
      const message = `Opt in error: ${error.message}`
      this.logger.error(message, { stack: error.stack })
      throw new ServiceException(message)
    }
  }
}

// ONLY DEV - Prints swagger json
// const storage = getMetadataArgsStorage()
// const spec = routingControllersToSpec(storage)
// console.log(util.inspect(spec, false, null, true /* enable colors */))
