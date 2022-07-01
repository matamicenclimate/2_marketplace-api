import AlgodClientProvider from '@common/services/AlgodClientProvider'
import { TransactionOperation } from '@common/services/TransactionOperation'
import OptInService from '@common/services/OptInService'
import algosdk from 'algosdk'
import Container, { Inject, Service } from 'typedi'
import * as WalletProvider from '@common/services/WalletAccountProvider'
import { AuctionAppState } from '@common/lib/types'
import CloseAuctionException from 'src/infrastructure/errors/CloseAutionException'
import CustomLogger from 'src/infrastructure/CustomLogger'
import UpdateListingService from './list/UpdateListingService'
import ListEntity from 'src/domain/model/ListEntity'

@Service()
export default class CloseAuction {
  readonly client = Container.get(AlgodClientProvider)
  readonly transactionOperation = Container.get(TransactionOperation)
  readonly wallet = WalletProvider.get()
  @Inject()
  readonly optInService: OptInService
  @Inject()
  readonly updateListingService: UpdateListingService
  @Inject()
  private readonly logger!: CustomLogger

  async execute(listings: ListEntity[]) {
    let errors: any[] = []
    for (const rekey of listings) {
      const appId = rekey.applicationIdBlockchain
      if (appId) {
        const { errors: resultErrors, isClosed } = await this._closeNFTAuction(appId)
        if (resultErrors.length) {
          this.logger.error('There are errors closing auction', { errors: resultErrors })
          errors.push(...resultErrors)
        } else if(isClosed) {
          this.logger.info('Updating rekey closed auction')
          const isClosedAuction = true
          await this.updateListingService.execute(appId, {isClosed: isClosedAuction})
          this.logger.info('Updated rekey closed auction')
        }
      }
    }
    if (errors.length) throw new CloseAuctionException('Error closing auctions', errors)
  }

  private async _closeNFTAuction(appId: number) {
    const APPLICATION_NO_EXIST = 404
    const errors = []
    let isClosed = false
    try {
      const state = await this.transactionOperation.getApplicationState(appId) as AuctionAppState
      const EXTRA_MS_TO_CLOSE_AUCTION = 70000
      const closeAuctionDate = (state.end * 1000) + EXTRA_MS_TO_CLOSE_AUCTION
      if (state && closeAuctionDate < Date.now()) {
        await this._closeAuction(appId, state)
        const numBids = state["num_bids"] as number
        this.logger.info(`Auction has ${numBids} bids`)
        if (!numBids) {
          const creator = algosdk.encodeAddress(state["creator"] as Uint8Array)
          const nftId = state["nft_id"] as number
          this.optInService.optInAssetByID(nftId, this.wallet.account.addr, creator, this.wallet.account, 1)
          this.logger.info(`Asset ${nftId} is returned to creator`)
        }
        isClosed = true
      }
    } catch (error) {
      if (error.status === APPLICATION_NO_EXIST) {
        this.logger.warn(`Application ${appId} already closed, it not exist`)
      } else {
        const errorResult = {
          name: 'CloseAuctionException',
          message: error.message,
          stack: error.stack
        }
        errors.push(errorResult)
      }
    }
    return { errors, isClosed }
  }
  private async _closeAuction(appId: number, appGlobalState: AuctionAppState) {
    const nftId = appGlobalState["nft_id"] as number
    let accounts = this._getInitialAccountsToSplitAlgos(appGlobalState)
    accounts = this._addMaxBidAccount(accounts, appGlobalState)
    await this._deleteTransactionToCloseAuction(appId, accounts, nftId)
  }

  async _deleteTransactionToCloseAuction(appId: number, accounts: string[], nftId: number) {
    const client = this.client.client
    const suggestedParams = await client.getTransactionParams().do()
    const deleteTxn = await algosdk.makeApplicationDeleteTxnFromObject({
      from: await (this.wallet.account).addr,
      suggestedParams,
      appIndex: appId,
      accounts: accounts,
      foreignAssets: [nftId],
    })
    return await this.transactionOperation.signAndConfirm(deleteTxn)
  }

  private _getInitialAccountsToSplitAlgos(appGlobalState: AuctionAppState) {
    const seller = algosdk.encodeAddress(appGlobalState["seller"] as Uint8Array)
    const cause = algosdk.encodeAddress(appGlobalState["cause"] as Uint8Array)
    const creator = algosdk.encodeAddress(appGlobalState["creator"] as Uint8Array)
    this.logger.info(`Closing auction with this accounts`)
    this.logger.info(`Seller account: ${seller}`)
    this.logger.info(`Cause account: ${cause}`)
    this.logger.info(`Creator account: ${creator}`)

    return [seller, cause, creator]
  }

  private _addMaxBidAccount(accounts: string[], appGlobalState: AuctionAppState) {
    const result = accounts
    const maxBidAccount = algosdk.encodeAddress(appGlobalState["bid_account"] as Uint8Array)
    this.logger.info(`Max bid account: ${maxBidAccount}`)
    if (maxBidAccount) {
      result.push(maxBidAccount)
    }
    return result
  }
}
