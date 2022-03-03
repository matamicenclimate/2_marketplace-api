import config from '../config/default'
import { NFTStorage, File } from 'nft.storage'
import CustomLogger from './CustomLogger'
import ServiceException from './errors/ServiceException'

class IpfsStorage {
  private token
  private ifpsData: any
  private ipfsData: any
  public storage: any
  private logger: CustomLogger
  constructor (logger) {
    this.token = config.nft.storage.token
    this.storage = null
    this.ipfsData = null
    this.logger = logger
    this.invoke()
  }

  invoke () {
    try {
      const token = this.token
      this.storage = new NFTStorage({ token })
    } catch (error) {
      const message = `Instanciate 'NFTStorage' class error: ${error.message}`
      this.logger.error(message, { stack: error.stack })
      throw new ServiceException(message)
    }
  }

  prepare (metadata, file) {
    try {
      this.ifpsData = {
        ...metadata,
        image: new File(
          [
            file.buffer
          ],
          file.originalname,
          { type: file.mimetype }
          )
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
      this.logger.error(message, { stack: error.stack })
      throw new ServiceException(message)
    }
  }
}

export {
  IpfsStorage
}
	