import AlgodClientProvider from '@common/services/AlgodClientProvider'
import { TransactionOperation } from '@common/services/TransactionOperation'
import algosdk from 'algosdk'
import Container, { Service } from 'typedi'
import * as WalletProvider from '@common/services/WalletAccountProvider'
import { AuctionAppState } from '@common/lib/types'
import { AssetNormalized } from 'src/interfaces'
import CloseAuctionException from 'src/infrastructure/errors/CloseAutionException'
@Service()
export default class CloseAuction {
  readonly client = Container.get(AlgodClientProvider)
  readonly transactionOperation = Container.get(TransactionOperation)
  readonly wallet = WalletProvider.get()

  async execute(nfts: AssetNormalized[]) {
    const APPLICATION_NO_EXIST = 404
    const errors = []
    for (const nft of nfts) {
      try {
        const appId = nft.arc69.properties.app_id
        if (appId) {
          const state: AuctionAppState = await this.transactionOperation.getApplicationState(appId)
          if (state.end * 1000 < Date.now()) {
            await this._closeAuction(appId, state)
          }
        }
      } catch (error) {
        if (error.status === APPLICATION_NO_EXIST) {
          console.log('..........APPLICATION_NO_EXIST')
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
    if (errors.length) throw new CloseAuctionException('Error closing auctions', errors)
  }
  private async _closeAuction(appId: number, appGlobalState: AuctionAppState) {
    const nftId = appGlobalState["nft_id"] as number
    console.warn('accounts',
      algosdk.encodeAddress(appGlobalState["seller"] as Uint8Array),
      algosdk.encodeAddress(appGlobalState["cause"] as Uint8Array),
      algosdk.encodeAddress(appGlobalState["creator"] as Uint8Array)
    )
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
  }
}
