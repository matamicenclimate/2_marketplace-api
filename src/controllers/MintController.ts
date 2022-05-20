import { Body, JsonController, Post } from 'routing-controllers'
import { Inject, Service } from 'typedi'
import OptInService from '@common/services/OptInService'
import * as WalletAccountProvider from '@common/services/WalletAccountProvider'
import AuctionService from '../services/AuctionService'
import ListingService from 'src/services/ListingService'
import UnsignedTransactionService from 'src/services/UnsignedTransactionService'
import TransactionGroupService from 'src/services/TransactionGroupService'
import config from '../config/default'
import { OpenAPI } from 'routing-controllers-openapi'
import CustomLogger from 'src/infrastructure/CustomLogger'
import ServiceException from 'src/infrastructure/errors/ServiceException'
import { AssetNormalized } from 'src/interfaces'
import { option } from '@octantis/option'
import { Response, Body as BodyCommon } from '@common/lib/api'
import { core } from '@common/lib/api/endpoints'
import DbConnectionService from 'src/services/DbConnectionService'
import algosdk from 'algosdk'

@Service()
@JsonController('/api')
export default class MintController {
  @Inject()
  readonly optInService: OptInService

  @Inject()
  readonly auctionService: AuctionService

  @Inject()
  readonly unsignedtransactionService: UnsignedTransactionService 

  @Inject()
  readonly transactionGroupService: TransactionGroupService 

  @Inject()
  readonly listingService: ListingService

  @Inject()
  private readonly logger!: CustomLogger

  @WalletAccountProvider.inject()
  private readonly wallet!: WalletAccountProvider.type

  @Post(`/${config.version}/create-auction`)
  async createAuction(
    @Body()
    {
      assetId,
      creatorWallet,
      causePercentage,
      startDate,
      endDate
    }: BodyCommon<core['post']['create-auction']>
  ): Promise<Response<core['post']['create-auction']>> {
    let attemps = 0
    while(true) {
      try {
        return await this.tryCreateAuction(assetId, creatorWallet, causePercentage, startDate, endDate)
      } catch (error) {
        const message = `Create auction error: ${error.message}`
        this.logger.error(message, { stack: error.stack })
        if (attemps >= 3) {
          const optOutTxUnsigned = await this.optInService.createOptInRequest(
            assetId,
            this.wallet.account.addr,
            creatorWallet,
            1)
          const depositTxUnsigned = await this.unsignedtransactionService.execute(this.wallet.account.addr, creatorWallet, this._getDepositAmount())
          
          const txId = await this.transactionGroupService.execute([optOutTxUnsigned, depositTxUnsigned])
          this.logger.info(`Asset ${assetId} is returned to creator and deposit too with transaction ${txId}`)
  
          throw new ServiceException(message)
        }
        attemps++
      }
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
  async optIn(
    @Body() body: BodyCommon<core['post']['opt-in']>
  ): Promise<Response<core['post']['opt-in']>> {
    try {
      const assetId = body.assetId
      await this.optInService.optInAssetByID(assetId)
      const populatedAsset = await this.listingService.populateAsset(assetId)
      const asset: option<AssetNormalized> =
        await this.listingService.normalizeAsset(populatedAsset)
      this.logger.info('Opt in result=', {
        asset: asset.isDefined() ? asset.value : undefined,
      })
      return {
        targetAccount: (await this.wallet.account).addr,
      }
    } catch (error) {
      const message = `Opt in error: ${error.message}`
      this.logger.error(message, { stack: error.stack })
      throw new ServiceException(message)
    }
  }
  async tryCreateAuction (
    assetId: number,
    creatorWallet: string,
    causePercentage: number,
    startDate: string,
    endDate: string
  ) {
    const populatedAsset = await this.listingService.populateAsset(assetId)
    const asset: option<AssetNormalized> = await this.listingService.normalizeAsset(populatedAsset)
    if (asset.isDefined()) {
      const db = await DbConnectionService.create()
      const response = await this.auctionService.execute(
        assetId,
        asset.value,
        creatorWallet,
        causePercentage,
        startDate,
        endDate,
        db
      )
      this.logger.info(
        `DONE: Sending back the asset ${assetId} to wallet owner.`
      )
      return response
    } else {
      throw new ServiceException(`Create auction error: Asset ${assetId} not found`)
    }
  }

  _getDepositAmount() {
    const RETURN_ASSET_TO_CREATOR_FEE = 1
    const DEPOSIT_TRANSACTION_FEE = 1
    const DEPOSIT = 4 - RETURN_ASSET_TO_CREATOR_FEE - DEPOSIT_TRANSACTION_FEE
    return DEPOSIT * algosdk.ALGORAND_MIN_TX_FEE
  }
}

