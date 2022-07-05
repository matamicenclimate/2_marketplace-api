import { Service } from 'typedi'
import AssetRepository from '../../infrastructure/repositories/AssetRepository'
import AssetEntity from '../../domain/model/AssetEntity'
import DbConnectionService from '../DbConnectionService'
import { option } from '@octantis/option'
import { FindOptionsWhere } from 'typeorm'

@Service()
export default class FindAllByQueryService {
  async execute(query: FindOptionsWhere<AssetEntity>): Promise<AssetEntity[]> {
    const db = await DbConnectionService.create()
    const repo = db.getRepository(AssetEntity)
    const repository =  new AssetRepository(repo)
    const result: option<AssetEntity[]> = await repository.findByQuery(query)
    if(result.isDefined()) {
      return result.value
    }
    return []
  }
}