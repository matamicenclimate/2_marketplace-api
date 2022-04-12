import { Get, JsonController } from 'routing-controllers'
import { Inject, Service } from 'typedi'
import HealthzService from '../services/HealthzService'
import { Response } from '@common/lib/api'
import { core } from '@common/lib/api/endpoints'

@Service()
@JsonController('/api')
export default class HealthzController {
  @Inject()
  private readonly service!: HealthzService

  @Get('/v1/healthz')
  async invoke(): Promise<Response<core['api']['v1']['get_healthz']>> {
    return this.service.execute()
  }
}
