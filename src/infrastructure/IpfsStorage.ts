import config from '../config/default'
import { NFTStorage, File } from 'nft.storage'

class IpfsStorage {
  private token
  private ifpsData: any
  private ipfsData: any
  public storage: any
  constructor () {
    this.token = config.nft.storage.token
    this.storage = null
    this.ipfsData = null
    this.invoke()
  }

  invoke () {
    const token = this.token
    this.storage = new NFTStorage({ token })
  }

  prepare (metadata, file) {
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
  }

  async store() {
    return this.storage.store(this.ipfsData)
  }
}

export {
  IpfsStorage
}
	