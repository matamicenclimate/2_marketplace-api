import { Repository } from 'typeorm'
import { none, option, some } from '@octantis/option'
import RekeyAccountRecord from '../../domain/model/RekeyAccount'
import { Service } from 'typedi'
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity'
export type Future<T> = Promise<option<T>>

@Service()
export default class RekeyRepository {
  constructor(private repo: Repository<RekeyAccountRecord>) {}
  async findOneByAppId(applicationId: number): Future<RekeyAccountRecord>{
    const result = await this.repo.findOne({
      where: {
        applicationId,
      },
    })
    if (result) return some(result)
    return none()
  }

  async updateOne(assetId: number, updateData: QueryDeepPartialEntity<RekeyAccountRecord>){
    return await this.repo.update({
        assetId,
      }, updateData)
  }
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