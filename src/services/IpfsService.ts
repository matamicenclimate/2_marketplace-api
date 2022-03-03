import { Service } from 'typedi'
import { IpfsRequestData } from '../interfaces'
import NftMetadata from '../domain/NftMetadata'
import Arc69Metadata from '../domain/Arc69Metadata'

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
	}
}

export interface Arc69Interface {
	standard: string
	description: string
	external_url: string
	mime_type: string
	properties: unknown
}

@Service()
export default class IpfsService {
  async execute(adapters, data: IpfsRequestData, file: any) {
		const { storage } = adapters
		const {
			title,
			author,
			description
		} = data
		
		const metadata: NftMetadataInterface = new NftMetadata(file, title, author, description).serialize()
		storage.prepare(metadata, file)
		const result = await storage.store()
		result.arc69 = new Arc69Metadata(description, result.data.image.href, result.data.properties).serialize()
		return result
  }
}
