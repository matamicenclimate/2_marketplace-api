import { Service } from 'typedi'
import DbConnectionService from '../DbConnectionService'
import { option } from '@octantis/option'
import ListEntity from '../../domain/model/ListEntity'
import ListRepository from '../../infrastructure/repositories/ListRepository'
import { UpdateResult } from 'typeorm'

@Service()
export default class UpdateListService {
  async execute(
    appId: number,
    data: Partial<ListEntity>
  ): Promise<UpdateResult | null> {
    const db = await DbConnectionService.create()
    const repo = db.getRepository(ListEntity)
    const query = new ListRepository(repo)
    const list: option<ListEntity> = await query.findOneByQuery({
      applicationIdBlockchain: appId,
    })
    let result = null
    if (list.isDefined()) {
      result = await query.updateOne(
        list.value.assetIdBlockchain,
        data as Omit<typeof data, 'asset' | 'offers'>
      )
    }
    return result
  }
}
