export interface IpfsRequestData {
  title: string
  author: string
  description: string
  price: number
  properties: Record<string, any>
}
export interface IpfsStorageInterface {
  storage: any
  store(ipfsData: any): Promise<any>
}

export interface Asset {
  amount: number
  'asset-id': number
  deleted: boolean
  'is-frozen': boolean
  'opted-in-at-round': number
}

export interface AssetTransactionResponse {
  'current-round': number
  'next-token': string
  transactions: Transaction[]
}

export interface Transaction {
  'asset-config-transaction'?: AssetConfigTransaction
  'close-rewards': number
  'closing-amount': number
  'confirmed-round': number
  'created-asset-index'?: number
  fee: number
  'first-valid': number
  'genesis-hash': string
  'genesis-id': string
  id: string
  'intra-round-offset': number
  'last-valid': number
  note?: string
  'receiver-rewards': number
  'round-time': number
  sender: string
  'sender-rewards': number
  signature: Signature
  'tx-type': string
  'asset-transfer-transaction'?: AssetTransferTransaction
}

export interface AssetConfigTransaction {
  'asset-id': number
  params: Params
}

export interface Params {
  clawback: string
  creator: string
  decimals: number
  'default-frozen': boolean
  freeze: string
  manager: string
  'metadata-hash': string
  name: string
  'name-b64': string
  reserve: string
  total: number
  url: string
  'url-b64': string
}

export interface AssetTransferTransaction {
  amount: number
  'asset-id': number
  'close-amount': number
  receiver: string
}

export interface Signature {
  sig: string
}

export interface AssetNormalized {
  arc69: Arc69
  image_url: string
  ipnft: string
  title: string
  url: string
  id: number
  creator: string
}

export interface Arc69 {
  description: string
  external_url: string
  mime_type: string
  properties: Properties
  standard: string
}

export interface Properties {
  app_id?: number
  artist: string
  cause: string
  causePercentage: number
  file: {
    name: string
    type: string
    size: number
  }
  date: Date
  price: number
}

export interface RekeyData {
  isClosedAuction: boolean
  appIndex: number
	wallet: string
	assetId: number
	startDate: string
	endDate: string
}
