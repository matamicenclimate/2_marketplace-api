import { Get, JsonController, Param, Post } from 'routing-controllers'
import { Inject, Service } from 'typedi'
import ListingService from '../services/ListingService'
import ServiceException from '../infrastructure/errors/ServiceException'
import CustomLogger from '../infrastructure/CustomLogger'
import config from '../config/default'

// ONLY DEV - Prints swagger json
// import { getMetadataArgsStorage } from 'routing-controllers'
// import { routingControllersToSpec } from 'routing-controllers-openapi'
// import util from 'util'

@Service()
@JsonController('/api')
export default class ListingsController {
  @Inject()
  readonly ListingService: ListingService
  @Inject()
  private readonly logger!: CustomLogger

  @Get(`/${config.version}/nfts`)
  async listing() {
    try {
      return await this.ListingService.listing()
    } catch (error) {
      const message = `Listing error: ${error.message}`
      this.logger.error(message, { stack: error.stack })
      throw new ServiceException(message)
    }
  }

  @Get(`/${config.version}/asset/:id`)
  async getAsset(@Param('id') id: number) {
    try {
      return await this.ListingService.getAsset(id)
    } catch (error) {
      const message = `Get asset error: ${error.message}`
      this.logger.error(message, { stack: error.stack })
      throw new ServiceException(message)
    }
  }
}

// ONLY DEV - Prints swagger json
// const storage = getMetadataArgsStorage()
// const spec = routingControllersToSpec(storage)
// console.log(util.inspect(spec, false, null, true /* enable colors */))
