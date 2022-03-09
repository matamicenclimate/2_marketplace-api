import { Arc69Interface } from "../services/IpfsService";

export default class Arc69Metadata {
  standard: string
	description: string
	external_url: string
	mime_type: string
	properties: unknown

  constructor(description, url, properties) {
    this.standard = 'arc69'
		this.description = description
		this.external_url = url
		this.mime_type = properties.file.type
		this.properties = {
			...properties,
			date: new Date().toISOString()
		} 
  }
  serialize(): Arc69Interface {
		return {
			standard: this.standard, 
			description: this.description,
			external_url: this.external_url,
			mime_type: this.mime_type,
			properties: this.properties,
		}
	}
}