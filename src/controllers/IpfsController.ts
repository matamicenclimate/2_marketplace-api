import { Post, BodyParam, UploadedFile, Controller } from 'routing-controllers'
import { Inject, Service } from 'typedi'
import IpfsService from '../services/IpfsService'
import CustomLogger from '../infrastructure/CustomLogger'
import { IpfsStorageInterface } from '../interfaces'
import {
  IpfsStorage
} from '../infrastructure/IpfsStorage'

@Service()
@Controller('/api')
export default class IpfsController {
  @Inject()
  private readonly service!: IpfsService
  @Inject()
  private readonly logger!: CustomLogger

  @Post('/v1/ipfs')
  async invoke(
    @BodyParam('data') data: any,
    @UploadedFile('file') file: any
  ) {
    if (typeof data === 'string') data = JSON.parse(data)
    const adapters: {
      storage: IpfsStorageInterface,
      logger: CustomLogger
    } = {
      storage: new IpfsStorage(this.logger),
      logger: this.logger
    }
    return this.service.execute(adapters, data, file)
  }
}
