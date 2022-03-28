import { inject } from '@common/services/AlgodConfigProvider'
import { AuctionLogic } from '@common/services/AuctionLogic'
import config from 'src/config/default'
import { Service } from 'typedi'

@Service()
export default class AuctionService {
  @inject()
  readonly auctionLogic: AuctionLogic
  async execute(assetId: number, reserve: number) {
    const auction = await this.auctionLogic.createAuction(assetId, reserve, parseInt(config.bid.increment))
    const appIndex = auction['application-index']
    this.auctionLogic.fundAuction(appIndex)
    this.auctionLogic.makeAppCallSetupProc(appIndex, assetId)

    return {
      appIndex
    }
  }
}
