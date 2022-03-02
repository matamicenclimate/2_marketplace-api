import { NftMetadataInterface } from "../services/IpfsService";

export default class NftMetadata {
  file: any
  title: string
  author: string
  description: string
  constructor(file, title, author, description) {
    this.file = file
    this.title = title
    this.author = author
    this.description = description    
  }
  serialize(): NftMetadataInterface {
		return {
			name: this.title,
			description: this.description,
			image: '',
			properties: {
				file: {
					name: this.file.originalname,
          type: this.file.mimetype,
					size: this.file.size
				},
				artist: this.author
			}
		}
	}
}