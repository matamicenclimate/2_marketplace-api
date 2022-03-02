import { Get, Post, BodyParam, UploadedFile, JsonController, Param } from 'routing-controllers'
import { Inject, Service } from 'typedi'
import IpfsService from '../services/IpfsService'
import { IpfsRequestData } from '../interfaces'

@Service()
@JsonController('/api')
export default class IpfsController {
  @Inject()
  private readonly service!: IpfsService



	@Post('/v1/ipfs')
  async invoke(@BodyParam('data') data: IpfsRequestData, @UploadedFile('file') file: File) {
    return this.service.execute(data, file)
  }

}