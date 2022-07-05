import { Service } from 'typedi'
import ListRepository from '../../infrastructure/repositories/ListRepository'
import ListEntity from '../../domain/model/ListEntity'
import DbConnectionService from '../DbConnectionService'

@Service()
export default class FindListingService {
  async execute(): Promise<any> {
    const db = await DbConnectionService.create()
    const repo = db.getRepository(ListEntity)
    const query =  new ListRepository(repo)
    const result: ListEntity[] = await query.find()
    return result
  }
}