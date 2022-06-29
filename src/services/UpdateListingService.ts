import { Service } from 'typedi'
import RekeyRepository from '../infrastructure/repositories/ListRepository'
import RekeyAccountRecord from '../domain/model/ListEntity'
import DbConnectionService from './DbConnectionService'
import { option } from '@octantis/option'

@Service()
export default class UpdateRekeyService {
  async execute(appId: number, isClosedAuction: boolean): Promise<any> {
    const db = await DbConnectionService.create()
    const repo = db.getRepository(RekeyAccountRecord)
    const query =  new RekeyRepository(repo)
    const rekey: option<RekeyAccountRecord> = await query.findOneByQuery({
      applicationIdBlockchain: appId
    })
    let result = null
    if(rekey.isDefined()) {
      result = await query.updateOne(rekey.value.assetIdBlockchain, {
        isClosed: isClosedAuction
      })
    }
    return result
  }
}