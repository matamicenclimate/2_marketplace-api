import Container, { Inject, Service } from 'typedi'
import CustomLogger from 'src/infrastructure/CustomLogger'
import { TransactionOperation } from '@common/services/TransactionOperation'
import { DirectSellAppState } from '@common/lib/types'
import AlgodClientProvider from '@common/services/AlgodClientProvider'
import * as WalletProvider from '@common/services/WalletAccountProvider'
import algosdk from 'algosdk'
import { sleep } from 'src/utils/helpers'

@Service()
export default class DeleteApplicationService {
  readonly transactionOperation = Container.get(TransactionOperation)
  readonly client = Container.get(AlgodClientProvider)
  readonly wallet = WalletProvider.get()

  @Inject()
  private readonly logger!: CustomLogger

  async execute(appId: number) {
    if (appId) {
      const isDeleted = await this._deleteApplication(appId)
      if(isDeleted) {
        this.logger.info(`Application: ${appId} has been deleted`)
      }

      return isDeleted
    }
  }

  private async _deleteApplication(appId: number) {
    const APPLICATION_NO_EXIST = 404
    let isDeleted = false
    const state = await this.transactionOperation.getApplicationState(appId) as DirectSellAppState
    if (state) {
      await this._closeApplication(appId, state)
      isDeleted = true
    }

    return isDeleted
  }

  private async _closeApplication(appId: number, appGlobalState: DirectSellAppState) {
    await this._deleteTransactionToCloseApplication(appId)
    try {
      await sleep(5000)
      await this._closeRekey(appGlobalState)
    } catch (error) {
      this.logger.error(`Error closing rekey account: ${error.message}`, { stack: error.stack })
      throw error
    }
  }

  async _deleteTransactionToCloseApplication(appId: number) {
    const client = this.client.client
    const suggestedParams = await client.getTransactionParams().do()
    const deleteTxn = await algosdk.makeApplicationDeleteTxnFromObject({
      from: await (this.wallet.account).addr,
      suggestedParams,
      appIndex: appId,
    })
    return await this.transactionOperation.signAndConfirm(deleteTxn)
  }

  private async _closeRekey(state: DirectSellAppState) {
    const rekey = algosdk.encodeAddress(state["rekey"] as Uint8Array)
    if(rekey) await this.closeRekeyRemainderToAccount(rekey)
  }

  public async closeRekeyRemainderToAccount(rekey: string, account = this.wallet.account) {
    return this.transactionOperation.closeReminderTransactionWithoutConfirm(
      await account,
      rekey
    )
  }
} 

