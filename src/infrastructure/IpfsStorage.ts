import config from '../config/default'
import { NFTStorage, File } from 'nft.storage'
import CustomLogger from './CustomLogger'
import ServiceException from './errors/ServiceException'

export interface FileLike {
  buffer: BlobPart
  originalname: string
  mimetype: any
}
class IpfsStorage {
  private token = config.nft.storage.token
  private ipfsData: any = null
  public storage: any = null

  constructor(private readonly logger: CustomLogger) {
    try {
      const token = this.token
      this.storage = new NFTStorage({ token })
    } catch (error) {
      const message = `Instanciate 'NFTStorage' class error: ${error.message}`
      this.logger.error(message, { stack: error.stack })
      throw new ServiceException(message)
    }
  }

  prepare(metadata: any, file: FileLike) {
    try {
      this.ipfsData = {
        ...metadata,
        image: new File([file.buffer], file.originalname, {
          type: file.mimetype,
        }),
      }
    } catch (error) {
      const message = `Instanciate NFTStorage 'File' class error: ${error.message}`
      this.logger.error(message, { stack: error.stack })
      throw new ServiceException(message)
    }
  }

  async store() {
    try {
      return await this.storage.store(this.ipfsData)
    } catch (error) {
      const message = `Calling store of 'NFTStorage' error: ${error.message}`
      this.logger.error(message, {
        stack: error.stack,
        ipfsData: this.ipfsData,
      })
      throw new ServiceException(message)
    }
  }
}

export { IpfsStorage }
