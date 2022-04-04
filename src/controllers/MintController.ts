import { Body, JsonController, Param, Post } from 'routing-controllers'
import Container, { Inject, Service } from 'typedi'
import OptInService from '@common/services/OptInService'
import AuctionService from '../services/AuctionService'
import config from '../config/default'
import { OpenAPI } from 'routing-controllers-openapi'
import ListingService from 'src/services/ListingService'
import CustomLogger from 'src/infrastructure/CustomLogger'
import ServiceException from 'src/infrastructure/errors/ServiceException'
import AlgodClientProvider from '@common/services/AlgodClientProvider'
import algosdk from 'algosdk'
import * as WalletAccountProvider from '@common/services/WalletAccountProvider'
import { TransactionOperation } from '@common/services/TransactionOperation'
import { AssetNormalized } from 'src/interfaces'
import { option } from '@octantis/option'

// ONLY DEV - Prints swagger json
// import { getMetadataArgsStorage } from 'routing-controllers'
// import { routingControllersToSpec } from 'routing-controllers-openapi'
// import util from 'util'

@Service()
@JsonController('/api')
export default class MintController {
  @Inject()
  readonly optInService: OptInService

  @Inject()
  readonly auctionService: AuctionService

  @Inject()
  readonly listingService: ListingService

  @Inject()
  private readonly logger!: CustomLogger

  @WalletAccountProvider.inject()
  private readonly wallet!: WalletAccountProvider.type

  @Post(`/${config.version}/create-auction`)
  async createAuction(@Body() { assetId }: { assetId: number }) {
    const populatedAsset = await this.listingService.populateAsset(assetId)
    const asset: option<AssetNormalized> = this.listingService.normalizeAsset(populatedAsset)
    if (asset.isDefined()) {
      const response = await this.auctionService.execute(
        assetId,
        asset.value?.arc69?.properties?.price
      )
      console.log(`DONE: Sending back the asset ${assetId} to wallet owner.`)
      return response
    }
  }

  @OpenAPI({
    description:
      'Creates a new assets (opts-in the asset) in the marketplace account.',
    responses: {
      200: 'The asset was opted in successfully, returns information about the transaction.',
      500: 'Unexpected internal error, contact support.',
      400: 'Missing (Or wrong/ill formatted) asset ID parameter.',
    },
  })
  @Post(`/${config.version}/opt-in`)
  async optIn(@Body() body: any) {
    // const op = Container.get(TransactionOperation)
    // const wallet = WalletAccountProvider.get()
    // const temp = algosdk.mnemonicToSecretKey(
    //   'various wild kitten cabbage fall myth write practice acid hockey stomach host argue planet plunge bread thank vocal equip verify right drastic crisp abstract top'
    // )
    // const suggestedParams = await Container.get(AlgodClientProvider)
    //   .client.getTransactionParams()
    //   .do()
    // {
    //   const tx = await algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    //     from: wallet.account.addr,
    //     to: temp.addr,
    //     amount: 1000000,
    //     suggestedParams,
    //   })
    //   await op.signAndConfirm(tx, undefined, temp)
    // }
    // const r = await algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    //   from: temp.addr,
    //   to: temp.addr,
    //   suggestedParams,
    //   amount: 0,
    //   rekeyTo: wallet.account.addr,
    // })
    // await op.signAndConfirm(r, undefined, temp)
    // throw new ServiceException('YOLO')
    try {
      const assetId = body.assetId
      await this.optInService.optInAssetByID(assetId)
      const populatedAsset = await this.listingService.populateAsset(assetId)
      const asset: option<AssetNormalized> =
        this.listingService.normalizeAsset(populatedAsset)
      console.log('Opt in result=', asset.isDefined() ? asset.value : undefined)
      return {
        targetAccount: this.wallet.account.addr,
      }
    } catch (error) {
      console.log(error.message, error.stack)
      const message = `Opt in error: ${error.message}`
      this.logger.error(message, { stack: error.stack })
      throw new ServiceException(message)
    }
  }
}

// ONLY DEV - Prints swagger json
// const storage = getMetadataArgsStorage()
// const spec = routingControllersToSpec(storage)
// console.log(util.inspect(spec, false, null, true /* enable colors */))
