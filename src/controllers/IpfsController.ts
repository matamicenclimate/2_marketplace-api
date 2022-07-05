import { Post, BodyParam, UploadedFile, Controller } from 'routing-controllers'
import { Inject, Service } from 'typedi'
import IpfsService from '../services/IpfsService'
import CustomLogger from '../infrastructure/CustomLogger'
import { IpfsStorageInterface } from '../interfaces'
import {
  IpfsStorage
} from '../infrastructure/IpfsStorage'
import { Response } from '@common/lib/api'
import { core } from '@common/lib/api/endpoints'
import ServiceException from '../infrastructure/errors/ServiceException'

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
  ): Promise<Response<core['post']['ipfs']>> {
    try {
      if (typeof data === 'string') data = JSON.parse(data)
      const adapters: {
        storage: IpfsStorageInterface,
        logger: CustomLogger
      } = {
        storage: new IpfsStorage(this.logger),
        logger: this.logger
      }
      return this.service.execute(adapters, data, file)
    } catch (error) {
      const message = `Upload IPFS error: ${error.message}`
      this.logger.error(message, { stack: error.stack })
      throw new ServiceException(message)
    }
  }
}
