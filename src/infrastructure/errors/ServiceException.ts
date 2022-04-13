export default class ServiceException extends Error {
  public statusCode: number
  public code: number
  constructor(message: string, code: number = 400) {
    super()
    this.message = message
    this.statusCode = 400
    this.code = code
  }
}