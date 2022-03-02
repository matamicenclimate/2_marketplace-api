export interface IpfsRequestData {
  title: string,
  author: string,
  description: string
}
export interface IpfsStorageInterface {
  storage: any
  store(ipfsData: any): Promise<any>
}