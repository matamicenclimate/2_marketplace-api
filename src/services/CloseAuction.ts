import AlgodClientProvider from '@common/services/AlgodClientProvider'
import { TransactionOperation } from '@common/services/TransactionOperation'
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
  private readonly logger!: CustomLogger

  async execute(nfts: AssetNormalized[]) {
    const APPLICATION_NO_EXIST = 404
    const errors = []
    for (const nft of nfts) {
      const appId = nft.arc69.properties.app_id
      if (appId) {
        let state = undefined
        try {
          state = await this.transactionOperation.getApplicationState(appId) as AuctionAppState
          if (state && (state.end * 1000) + 70000 < Date.now()) {
            await this._closeAuction(appId, state)
          }
        } catch (error) {
          if (error.status === APPLICATION_NO_EXIST) {
            this.logger.error('..........APPLICATION_NO_EXIST')
            continue;
          } else {
            const errorResult = {
              name: 'CloseAuctionExeption',
              message: error.message,
              stack: error.stack
            }
            errors.push(errorResult)
          }
        }
      }
    }
    if (errors.length) throw new CloseAuctionException('Error closing auctions', errors)
  }
  private async _closeAuction(appId: number, appGlobalState: AuctionAppState) {
    const nftId = appGlobalState["nft_id"] as number
    this.logger.warn(`Seller account: ${algosdk.encodeAddress(appGlobalState["seller"] as Uint8Array)}`)
    this.logger.warn(`Cause account: ${algosdk.encodeAddress(appGlobalState["cause"] as Uint8Array)}`)
    this.logger.warn(`Creator account: ${algosdk.encodeAddress(appGlobalState["creator"] as Uint8Array)}`)

    const accounts = [
      algosdk.encodeAddress(appGlobalState["seller"] as Uint8Array),
      algosdk.encodeAddress(appGlobalState["cause"] as Uint8Array),
      algosdk.encodeAddress(appGlobalState["creator"] as Uint8Array)
    ]
    if (appGlobalState["bid_account"]) {
      accounts.push(algosdk.encodeAddress(appGlobalState["bid_account"] as Uint8Array))
    }
    const client = this.client.client
    const suggestedParams = await client.getTransactionParams().do()
    const deleteTxn = await algosdk.makeApplicationDeleteTxnFromObject({
      from: this.wallet.account.addr,
      suggestedParams,
      appIndex: appId,
      accounts: accounts,
      foreignAssets: [nftId],
    })
    await this.transactionOperation.signAndConfirm(deleteTxn)
    try {
      await sleep(5000)
      await this._closeRekey(appGlobalState)
    } catch (error) {
      this.logger.error(error.message, error.stack)
      throw error
    }
  }

  private async _closeRekey(state: AuctionAppState) {
    const rekey = algosdk.encodeAddress(state["rekey"] as Uint8Array)
    if (rekey) await this.transactionOperation.closeReminderTransaction(
      this.wallet.account,
      rekey
    )
  }
}
