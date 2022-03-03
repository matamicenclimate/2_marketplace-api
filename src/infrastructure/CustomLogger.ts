import logger, { Logger } from 'pino'
import { Service } from 'typedi'
import LoggerInterface from './LoggerInterface'

@Service()
export default class CustomLogger implements LoggerInterface {
  private logger: Logger
  constructor () {
    this.logger = logger()
  }

  info (message: string, data: any) {
    const child = this.logger.child(data)
    if(process.env.NODE_ENV !== 'testing') child.info(message)
  }

  error (message: string, data: any) {
    const child = this.logger.child(data)
    if(process.env.NODE_ENV !== 'testing') child.error(message)
  }
}