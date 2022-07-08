import { Service } from 'typedi'
import DbConnectionService from '../DbConnectionService'
import OfferEntity from '../../domain/model/OfferEntity'
import OfferRepository from '../../infrastructure/repositories/OfferRepository'
import { DataSource, UpdateResult } from 'typeorm'
import { option } from '@octantis/option'
export type Future<T> = Promise<option<T>>

@Service()
export default class OfferService {
  async create(db: DataSource, data: Partial<OfferEntity>): Promise<OfferEntity> {
    const repo = db.getRepository(OfferEntity)
    const query =  new OfferRepository(repo)
    return await query.insert(data)
  }
}
