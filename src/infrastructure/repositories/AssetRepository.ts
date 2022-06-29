import { FindOptionsWhere, Repository } from 'typeorm'
import { none, option, some } from '@octantis/option'
import { Service } from 'typedi'
import AssetEntity from '../../domain/model/AssetEntity'
export type Future<T> = Promise<option<T>>

@Service()
export default class AssetRepository {
  constructor(private repo: Repository<AssetEntity>) {}
  async insert(entity: AssetEntity) {
    return await this.repo.save(entity)
  }
}