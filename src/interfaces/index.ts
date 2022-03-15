export interface IpfsRequestData {
  title: string,
  author: string,
  description: string
  properties: Record<string, any>
}
export interface IpfsStorageInterface {
  storage: any
  store(ipfsData: any): Promise<any>
}