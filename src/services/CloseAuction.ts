import AlgodClientProvider from '@common/services/AlgodClientProvider'
import { TransactionOperation } from '@common/services/TransactionOperation'
import OptInService from '@common/services/OptInService'
import algosdk from 'algosdk'
import Container, { Inject, Service } from 'typedi'
import * as WalletProvider from '@common/services/WalletAccountProvider'
import { AuctionAppState } from '@common/lib/types'
import { AssetNormalized } from 'src/interfaces'
import CloseAuctionException from 'src/infrastructure/errors/CloseAutionException'
import { sleep } from 'src/utils/helpers'
import CustomLogger from 'src/infrastructure/CustomLogger'

@Service()
export default class CloseAuction {
  readonly client = Container.get(AlgodClientProvider)
  readonly transactionOperation = Container.get(TransactionOperation)
  readonly wallet = WalletProvider.get()
  @Inject()
  readonly optInService: OptInService
  @Inject()
  private readonly logger!: CustomLogger

  async execute(nfts: AssetNormalized[]) {
    let errors: any[] = []
    for (const nft of nfts) {
      const appId = nft.arc69.properties.app_id
      if (appId) {
        errors = await this._closeNFTAuction(appId)
      }
    }
    if (errors.length) throw new CloseAuctionException('Error closing auctions', errors)
  }

  private async _closeNFTAuction(appId: number) {
    const APPLICATION_NO_EXIST = 404
    const errors = []
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
    return errors
  }
  private async _closeAuction(appId: number, appGlobalState: AuctionAppState) {
    const nftId = appGlobalState["nft_id"] as number
    let accounts = this._getInitialAccountsToSplitAlgos(appGlobalState)
    accounts = this._addMaxBidAccount(accounts, appGlobalState)
    await this._deleteTransactionToCloseAuction(appId, accounts, nftId)
    try {
      await sleep(5000)
      await this._closeRekey(appGlobalState)
    } catch (error) {
      this.logger.error(`Error closing rekey account: ${error.message}`, { stack: error.stack })
      throw error
    }
  }

  private async _deleteTransactionToCloseAuction(appId: number, accounts: string[], nftId: number) {
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

  private async _closeRekey(state: AuctionAppState) {
    const rekey = algosdk.encodeAddress(state["rekey"] as Uint8Array)
    if (rekey) await this.transactionOperation.closeReminderTransaction(
      await this.wallet.account,
      rekey
    )
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
