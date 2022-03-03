import { Post, BodyParam, UploadedFile, JsonController, Req } from 'routing-controllers'
import { Inject, Service } from 'typedi'
import IpfsService from '../services/IpfsService'
import CustomLogger from '../infrastructure/CustomLogger'
import { IpfsRequestData, IpfsStorageInterface } from '../interfaces'
import {
  IpfsStorage
} from '../infrastructure/IpfsStorage'

@Service()
@JsonController('/api')
export default class IpfsController {
  @Inject()
  private readonly service!: IpfsService
  @Inject()
  private readonly logger!: CustomLogger

	@Post('/v1/ipfs')
  async invoke(
    @BodyParam('data') data: IpfsRequestData,
    @UploadedFile('file') file: any
  ) {
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