import { DataSource, Repository } from 'typeorm'
import RekeyAccountRecord from '../../domain/model/RekeyAccount'
import config from '../../config/default'
import { Service } from 'typedi'

@Service()
export default class RekeyRepository {
  static async create() {
    const db = await new DataSource({
      type: 'sqlite',
      database: config.dbName,
      synchronize: true,
      entities: [RekeyAccountRecord],
    }).initialize()
    const repo = db.getRepository(RekeyAccountRecord)
    return new RekeyRepository(repo)
  }
  constructor(private repo: Repository<RekeyAccountRecord>) {}

  /**
   * Saves one rekey account.
   */
  async insert(entity: RekeyAccountRecord) {
    return await this.repo.save(entity)
  }

  /**
   * Fetches all rekey accounts.
   */
  async find() {
    return await this.repo.find()
  }
}