import AlgodClientProvider from '@common/services/AlgodClientProvider'
import { AuctionLogic } from '@common/services/AuctionLogic'
import OptInService from '@common/services/OptInService'
import config from 'src/config/default'
import Container, { Service } from 'typedi'
import algosdk from 'algosdk'

@Service()
export default class AuctionService {
  readonly auctionLogic: AuctionLogic
  readonly optInService: OptInService
  readonly client: AlgodClientProvider

  constructor() {
    this.optInService = Container.get(OptInService)
    this.auctionLogic = Container.get(AuctionLogic)
    this.client = Container.get(AlgodClientProvider)
  }

  async execute(assetId: number, reserve: number) {
    const auction = await this.auctionLogic.createAuction(
      assetId,
      reserve,
      parseInt(config.bid.increment)
    )
    const appIndex = auction['application-index']
    const appAddr = algosdk.getApplicationAddress(appIndex)
    console.log('Opting in for:', appAddr)
    const result = await this.optInService.optInAssetByID(assetId, appAddr)
    console.log(
      `Asset ${assetId} opted in into ${appAddr}[appIndex:${appIndex}]:`,
      result
    )
    this.auctionLogic.fundAuction(appIndex)
    console.log('FUNDED')
    this.auctionLogic.makeAppCallSetupProc(appIndex, assetId)
    console.log('SETUP')
    return {
      appIndex,
    }
  }
}
