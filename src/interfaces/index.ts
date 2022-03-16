export interface IpfsRequestData {
  title: string,
  author: string,
  description: string
  price: number
  properties: Record<string, any>
}
export interface IpfsStorageInterface {
  storage: any
  store(ipfsData: any): Promise<any>
}