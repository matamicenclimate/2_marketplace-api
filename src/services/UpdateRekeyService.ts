import { Service } from 'typedi'
import RekeyRepository from '../infrastructure/repositories/RekeyRepository'
import RekeyAccountRecord from '../domain/model/RekeyAccount'
import DbConnectionService from './DbConnectionService'
import { option } from '@octantis/option'

@Service()
export default class UpdateRekeyService {
  async execute(appId: number, isClosedAuction: boolean): Promise<any> {
    const db = await DbConnectionService.create()
    const repo = db.getRepository(RekeyAccountRecord)
    const query =  new RekeyRepository(repo)
    const rekey: option<RekeyAccountRecord> = await query.findOneByQuery({
      applicationId: appId
    })
    let result = null
    if(rekey.isDefined()) {
      result = await query.updateOne(rekey.value.assetId, {
        isClosedAuction
      })
    }
    return result
  }
}