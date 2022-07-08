import { Body, JsonController, Post, Put } from 'routing-controllers'
import { Inject, Service } from 'typedi'
import config from '../config/default'
import CustomLogger from '../infrastructure/CustomLogger'
import { Response, Body as BodyCommon } from '@common/lib/api'
import { core } from '@common/lib/api/endpoints'
import DbConnectionService from '../services/DbConnectionService'
import UpdatePriceListingService from 'src/services/list/UpdatePriceListingService'
import OfferService from 'src/services/offer/OfferService'
import ServiceException from 'src/infrastructure/errors/ServiceException'

@Service()
@JsonController('/api')
export default class OfferController {
  @Inject()
  private readonly logger!: CustomLogger
  @Inject()
  readonly updateListingService: UpdatePriceListingService

  @Inject()
  readonly offerService: OfferService

  @Put(`/${config.version}/make-offer`)
  async createAuction(
    @Body()
    {
      assetId,
      offerWallet,
      transactionId,
      listingId,
      type,
      price
    }: BodyCommon<core['put']['make-offer']>
  ): Promise<Response<core['put']['make-offer']>> {
    try {
      const db = await DbConnectionService.create()
      const response = await this.offerService.create(db, {
        offerWallet,
        transactionId,
        listingId,
        price
      })
      if (type === 'auction') await this.updateListingService.execute(db, assetId, price)
      return response  
    } catch (error) {
      const message = `Make offer error: ${error.message}`
      this.logger.error(message, { stack: error.stack })
      throw new ServiceException(message)
    }
  }
}

