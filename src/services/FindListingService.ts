import { Inject, Service } from 'typedi'
import RekeyRepository from '../infrastructure/repositories/ListRepository'
import RekeyAccountRecord from '../domain/model/ListEntity'
import DbConnectionService from './DbConnectionService'

@Service()
export default class FindListingService {
  async execute(): Promise<any> {
    const db = await DbConnectionService.create()
    const repo = db.getRepository(RekeyAccountRecord)
    const query =  new RekeyRepository(repo)
    const result: RekeyAccountRecord[] = await query.find()
    return result
  }
}