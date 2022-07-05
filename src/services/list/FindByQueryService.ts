import { Service } from 'typedi'
import ListRepository from '../../infrastructure/repositories/ListRepository'
import ListEntity from '../../domain/model/ListEntity'
import DbConnectionService from '../DbConnectionService'
import { option } from '@octantis/option'
import { FindOptionsWhere } from 'typeorm'

@Service()
export default class FindByQueryService {
  async execute(query: FindOptionsWhere<ListEntity>): Promise<ListEntity[]> {
    const db = await DbConnectionService.create()
    const repo = db.getRepository(ListEntity)
    const repository =  new ListRepository(repo)
    const result: option<ListEntity[]> = await repository.findByQuery(query)
    if(result.isDefined()) {
      return result.value
    }
    return []
  }
}