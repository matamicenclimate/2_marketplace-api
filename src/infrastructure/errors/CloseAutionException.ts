export default class CloseAuctionException extends Error {
  public statusCode: number
  public code: number
  public errors: Error[]
  constructor(message: string, errors: Error[]) {
    super()
    this.message = message
    this.statusCode = 400
    this.code = 400
    this.errors = errors
  }
}