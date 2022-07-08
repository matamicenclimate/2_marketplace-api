import { Service } from 'typedi'
import ListEntity from '../../domain/model/ListEntity'
import ListRepository from '../../infrastructure/repositories/ListRepository'
import { DataSource, UpdateResult } from 'typeorm'

@Service()
export default class UpdatePriceListService {
  async execute(db: DataSource, assetId: number, price: number): Promise<UpdateResult | null> {
    const repo = db.getRepository(ListEntity)
    const query =  new ListRepository(repo)
    return await query.updateOne(assetId, { price })
  }
}