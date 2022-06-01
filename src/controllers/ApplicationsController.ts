import { Delete, JsonController, Param } from 'routing-controllers'
import { Inject, Service } from 'typedi'
import DeleteApplicationService from '../services/DeleteApplicationService'
import CustomLogger from '../infrastructure/CustomLogger'
import ServiceException from 'src/infrastructure/errors/ServiceException'
import UpdateRekeyService from 'src/services/UpdateRekeyService'

@Service()
@JsonController('/api')
export default class ApplicationsController {
  @Inject()
  private readonly deleteApplicationService!: DeleteApplicationService
  @Inject()
  private readonly logger!: CustomLogger
  @Inject()
  readonly updateRekeyService: UpdateRekeyService

  @Delete('/v1/sell-asset/:appId')
  async delete(@Param('appId') appId: number) {
    try {
      const result = await this.deleteApplicationService.execute(
        appId
      )
      if (result) {
        await this.updateRekeyService.execute(appId, result)
        return {}
      }
    } catch (error) {
      const message = `Delete cause error: ${error.message}`
      this.logger.error(message, { stack: error.stack })
      throw new ServiceException(message)
    }
  }
}
