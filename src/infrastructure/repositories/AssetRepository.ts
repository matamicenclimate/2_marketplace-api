import { FindOptionsWhere, Repository } from 'typeorm'
import { none, option, some } from '@octantis/option'
import { Service } from 'typedi'
import AssetEntity from '../../domain/model/AssetEntity'
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity'
export type Future<T> = Promise<option<T>>

@Service()
export default class AssetRepository {
  constructor(private repo: Repository<AssetEntity>) {}
  async insert(entity: AssetEntity) {
    return await this.repo.save(entity)
  }

  async findOneByQuery(query: FindOptionsWhere<AssetEntity>): Future<AssetEntity>{
    const result = await this.repo.findOne({
      where: query,
    })
    if (result) return some(result)
    return none()
  }

  async updateOne(assetId: number, updateData: QueryDeepPartialEntity<AssetEntity>){
    return await this.repo.update({
        assetIdBlockchain: assetId,
      }, updateData)
  }

  async findByQuery(query: FindOptionsWhere<AssetEntity>): Future<AssetEntity[]>{
    const result = await this.repo.find({
      where: query,
    })
    if (result) return some(result)
    return none()
  }
}