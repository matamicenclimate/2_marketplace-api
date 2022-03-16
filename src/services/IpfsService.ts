import { Service } from 'typedi'
import { IpfsRequestData } from '../interfaces'
import NftMetadata, { resultProperties } from '../domain/NftMetadata'
import Arc69Metadata, { CauseInfo } from '../domain/Arc69Metadata'
import ServiceException from '../infrastructure/errors/ServiceException'

export interface NftMetadataInterface {
	name: string
	description: string
	image: string
  properties: {
    file: {
      name: string
      type: string
      size: number
    }
    artist: string
    price: number
  }
}

export interface Arc69Interface {
	standard: string
	description: string
	external_url: string
	mime_type: string
	properties: Record<string, any>
}

function nomalizeProperties(resultProperties: resultProperties, properties: Record<string, any> & CauseInfo) {
  return {
    ...resultProperties,
    ...properties
  }
}

function isPropertiesValid(properties: Record<string, any>) : properties is CauseInfo & Record<string, any> {
  return typeof properties.cause === 'string' && typeof properties.causePercentage === 'number'
}

@Service()
export default class IpfsService {
  async execute(adapters: { storage: any; logger: any }, data: IpfsRequestData, file: any) {
    const { storage, logger } = adapters
		logger.info('Execute upload ipfs service', { ifpsRequestData: data })
		const {
      title,
			author,
			description,
      price,
      properties,
		} = data
    if (!isPropertiesValid(properties)) {
      throw new ServiceException('Invalid input parameters')
    }
		
		const metadata: NftMetadataInterface = new NftMetadata(file, title, author, description, price).serialize()
		storage.prepare(metadata, file)
		const result = await storage.store()
    const propertiesNormalized = nomalizeProperties(result.data.properties, properties)
		result.arc69 = new Arc69Metadata(description, result.data.image.href, propertiesNormalized).serialize()
    result.image_url = result.data.image.href.replace('ipfs://', 'https://cloudflare-ipfs.com/ipfs/')
    result.title = title

		return result
  }
}
