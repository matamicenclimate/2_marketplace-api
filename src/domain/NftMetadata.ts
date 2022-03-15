import { NftMetadataInterface } from "../services/IpfsService";

export type resultPorperties = {
  file: {
    name: string
    type: string
    size: number
  },
  artist: string
}
export default class NftMetadata {
  constructor(
    public file: any,
    public title: string,
    public author: string,
    public description: string
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
				artist: this.author
			}
		}
	}
}