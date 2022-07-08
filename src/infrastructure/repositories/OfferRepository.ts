import { FindOptionsWhere, Repository } from 'typeorm'
import { none, option, some } from '@octantis/option'
import { Service } from 'typedi'
import OfferEntity from '../../domain/model/OfferEntity'
export type Future<T> = Promise<option<T>>

@Service()
export default class OfferRepository {
  constructor(private repo: Repository<OfferEntity>) {}
  async insert(entity: Partial<OfferEntity>) {
    return await this.repo.save(entity)
  }

  async findByQuery(query: FindOptionsWhere<OfferEntity>): Future<OfferEntity[]>{
    const result = await this.repo.find({
      where: query,
    })
    if (result) return some(result)
    return none()
  }
}