import { Delete, JsonController, Param } from 'routing-controllers'
import { Inject, Service } from 'typedi'
import DeleteApplicationService from '../services/DeleteApplicationService'
import CustomLogger from '../infrastructure/CustomLogger'
import ServiceException from '../infrastructure/errors/ServiceException'
import UpdateListingService from '../services/list/UpdateListingService'

@Service()
@JsonController('/api')
export default class ApplicationsController {
  @Inject()
  private readonly deleteApplicationService!: DeleteApplicationService
  @Inject()
  private readonly logger!: CustomLogger
  @Inject()
  readonly updateListingService: UpdateListingService

  @Delete('/v1/sell-asset/:appId')
  async delete(@Param('appId') appId: number) {
    try {
      const result = await this.deleteApplicationService.execute(
        appId
      )
      if (result) {
        await this.updateListingService.execute(appId, {isClosed: result})
        return {}
      }
    } catch (error) {
      const message = `Delete aplication error: ${error.message}`
      this.logger.error(message, { stack: error.stack })
      throw new ServiceException(message)
    }
  }
}
