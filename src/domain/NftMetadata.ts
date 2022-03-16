import { NftMetadataInterface } from "../services/IpfsService";

export type resultProperties = {
  file: {
    name: string
    type: string
    size: number
  },
  artist: string
  price: number
}
export default class NftMetadata {
  constructor(
    public file: any,
    public title: string,
    public author: string,
    public description: string,
    public price: number
  ) {}

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
				artist: this.author,
        price: this.price
			}
		}
	}
}