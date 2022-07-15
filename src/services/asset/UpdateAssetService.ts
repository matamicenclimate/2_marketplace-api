import { Service } from 'typedi'
import DbConnectionService from '../DbConnectionService'
import AssetEntity from '../../domain/model/AssetEntity'
import AssetRepository from '../../infrastructure/repositories/AssetRepository'
import { UpdateResult } from 'typeorm'

@Service()
export default class UpdateAssetService {
  async execute(
    assetIdBlockchain: number,
    data: Partial<AssetEntity>
  ): Promise<UpdateResult | null> {
    const db = await DbConnectionService.create()
    const repo = db.getRepository(AssetEntity)
    const query = new AssetRepository(repo)
    return await query.updateOne(
      assetIdBlockchain,
      data as Omit<typeof data, 'arc69'>
    )
  }
}
