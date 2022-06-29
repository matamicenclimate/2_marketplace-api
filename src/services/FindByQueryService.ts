import { Service } from 'typedi'
import RekeyRepository from '../infrastructure/repositories/ListRepository'
import ListEntity from '../domain/model/ListEntity'
import DbConnectionService from './DbConnectionService'
import { option } from '@octantis/option'
import { FindOptionsWhere } from 'typeorm'

@Service()
export default class FindByQueryService {
  async execute(query: FindOptionsWhere<ListEntity>): Promise<ListEntity[]> {
    const db = await DbConnectionService.create()
    const repo = db.getRepository(ListEntity)
    const repository =  new RekeyRepository(repo)
    const rekeys: option<ListEntity[]> = await repository.findByQuery(query)
    if(rekeys.isDefined()) {
      return rekeys.value
    }
    return []
  }
}