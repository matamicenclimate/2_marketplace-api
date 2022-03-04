import { Get, JsonController, Param } from 'routing-controllers'
import { Inject, Service } from 'typedi'
import HealthzService from '../services/HealthzService'

@Service()
@JsonController('/api')
export default class HealthzController {
  @Inject()
  private readonly service!: HealthzService

  @Get('/v1/healthz')
  async invoke() {
    return this.service.execute()
  }
}
