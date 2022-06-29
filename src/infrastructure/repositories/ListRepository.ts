import { FindOptionsWhere, Repository } from 'typeorm'
import { none, option, some } from '@octantis/option'
import { Service } from 'typedi'
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity'
import ListEntity from '../../domain/model/ListEntity'

export type Future<T> = Promise<option<T>>

@Service()
export default class ListRepository {
  constructor(private repo: Repository<ListEntity>) {}
  async findOneByQuery(query: FindOptionsWhere<ListEntity>): Future<ListEntity>{
    const result = await this.repo.findOne({
      where: query,
    })
    if (result) return some(result)
    return none()
  }

  async findByQuery(query: FindOptionsWhere<ListEntity>): Future<ListEntity[]>{
    const result = await this.repo.find({
      where: query,
      relations: ['asset', 'auction']
    })
    if (result) return some(result)
    return none()
  }

  async updateOne(assetId: number, updateData: QueryDeepPartialEntity<ListEntity>){
    return await this.repo.update({
        assetIdBlockchain: assetId,
      }, updateData)
  }
  /**
   * Saves one rekey account.
   */
  async insert(entity: ListEntity) {
    console.log('......entity', entity)
    return await this.repo.save(entity)
  }

  /**
   * Fetches all rekey accounts.
   */
  async find() {
    return await this.repo.find()
  }
}