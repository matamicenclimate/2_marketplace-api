import { FindOptionsWhere, Repository } from 'typeorm'
import { none, option, some } from '@octantis/option'
import { Service } from 'typedi'
import AuctionEntity from '../../domain/model/AuctionEntity'
export type Future<T> = Promise<option<T>>

@Service()
export default class AuctionRepository {
  constructor(private repo: Repository<AuctionEntity>) {}
  async insert(entity: AuctionEntity) {
    return await this.repo.save(entity)
  }
}