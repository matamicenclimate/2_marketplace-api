import { Repository } from 'typeorm'
import RekeyAccountRecord from '../../domain/model/RekeyAccount'
import { Service } from 'typedi'

@Service()
export default class RekeyRepository {
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