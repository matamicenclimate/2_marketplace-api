import { Arc69Interface } from "../services/IpfsService";
import { resultProperties } from "./NftMetadata";

export type CauseInfo = {
  cause: string,
  causePercentage: number,
}

type Properties = Record<string, any> & resultProperties & CauseInfo

export default class Arc69Metadata {
  readonly standard = 'arc69'
  constructor(
    public description: string,
    public external_url: string,
    public properties: Properties,
    public mime_type: string = properties.file.type
  ) {
    properties.date = new Date().toISOString()
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