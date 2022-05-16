import { Inject, Service } from 'typedi'
import RekeyRepository from '../infrastructure/repositories/RekeyRepository'
import RekeyAccountRecord from '../domain/model/RekeyAccount'
import DbConnectionService from './DbConnectionService'

@Service()
export default class FindRekey {
  async execute(): Promise<any> {
    const db = await DbConnectionService.create()
    const repo = db.getRepository(RekeyAccountRecord)
    const query =  new RekeyRepository(repo)
    const result: RekeyAccountRecord[] = await query.find()
    return result
  }
}