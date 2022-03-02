import { Service } from 'typedi'
import { IpfsRequestData } from '../interfaces'
import NftMetadata from '../domain/NftMetadata'

export type NftMetadataInterface = {
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
		return storage.store()
  }
}
