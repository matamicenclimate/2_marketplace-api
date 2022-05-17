import { Service } from 'typedi'
import RekeyRepository from '../infrastructure/repositories/RekeyRepository'
import RekeyAccountRecord from '../domain/model/RekeyAccount'
import DbConnectionService from './DbConnectionService'
import { option } from '@octantis/option'
import { FindOptionsWhere } from 'typeorm'

@Service()
export default class FindByQueryService {
  async execute(query: FindOptionsWhere<RekeyAccountRecord>): Promise<any> {
    const db = await DbConnectionService.create()
    const repo = db.getRepository(RekeyAccountRecord)
    const repository =  new RekeyRepository(repo)
    const rekeys: option<RekeyAccountRecord[]> = await repository.findByQuery(query)
    if(rekeys.isDefined()) {
      return rekeys.value
    }
    return []
  }
}