import { Inject, Service } from 'typedi'
import RekeyRepository from '../infrastructure/repositories/RekeyRepository'
import RekeyAccountRecord from '../domain/model/RekeyAccount'

@Service()
export default class FindRekey {
  @Inject()
  private readonly repo!: RekeyRepository

  async execute(): Promise<any> {
    const result: RekeyAccountRecord[] = await this.repo.find()
    return result
  }
}