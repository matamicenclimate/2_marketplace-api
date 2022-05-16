import { DataSource } from 'typeorm'
import RekeyAccountRecord from '../domain/model/RekeyAccount'
import config from '../config/default'
import { Service } from 'typedi'

@Service()
export default class DbConnectionService {
  static async create() {
    const db = await new DataSource({
      type: 'sqlite',
      database: `./databases/${config.environment}-${config.dbName}`,
      synchronize: true,
      entities: [RekeyAccountRecord],
    }).initialize()
    return db
  }
}