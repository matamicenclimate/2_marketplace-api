import AlgodClientProvider from '@common/services/AlgodClientProvider'
import { AuctionLogic } from '@common/services/AuctionLogic'
import OptInService from '@common/services/OptInService'
import config from 'src/config/default'
import Container, { Inject, Service } from 'typedi'
import axios from 'axios'
import algosdk from 'algosdk'
import { appendFileSync } from 'fs'
import * as WalletAccountProvider from '@common/services/WalletAccountProvider'
import { TransactionOperation } from '@common/services/TransactionOperation'
import CustomLogger from 'src/infrastructure/CustomLogger'
import { AssetNormalized } from 'src/interfaces'

@Service()
export default class AuctionService {
  readonly auctionLogic: AuctionLogic
  readonly optInService: OptInService
  readonly client: AlgodClientProvider
  readonly account: WalletAccountProvider.type
  readonly op: TransactionOperation
  @Inject()
  private readonly logger!: CustomLogger

  constructor() {
    this.optInService = Container.get(OptInService)
    this.auctionLogic = Container.get(AuctionLogic)
    this.client = Container.get(AlgodClientProvider)
    this.account = WalletAccountProvider.get()
    this.op = Container.get(TransactionOperation)
  }

  async execute(
    assetId: number,
    asset: AssetNormalized,
    creatorWallet: string,
    cp: string,
  ) {
    this.logger.info('Creating auction')
    const rekeyAccount = await this.generateRekeyAccount()
    let causePercentaje = parseInt(cp)
    let { cause, percentages } = await this._getCauseInfo(asset.arc69.properties.cause)
    const causeP = parseInt(percentages.data.percentages.cause)
    if (causeP > causePercentaje) {
      causePercentaje = causeP
    }
    const creatorPercentaje = 100 - causePercentaje - parseInt(percentages.data.percentages.marketplace)
    const appIndex = await this.createAuction(
      assetId,
      asset.arc69.properties.price,
      rekeyAccount,
      asset,
      cause.data.wallet,
      creatorWallet,
      causePercentaje,
      creatorPercentaje
    )
    return {
      appIndex,
    }
  }

  async createAuction(
    assetId: number,
    reserve: number,
    rekeyAccount: algosdk.Account,
    asset: AssetNormalized,
    causeWallet: string,
    creatorWallet: string,
    causePercentaje: number,
    creatorPercentaje: number
  ): Promise<number> {
    this.logger.info(`Creating auction`)
    const auction = await this.auctionLogic.createAuction(
      assetId,
      reserve,
      parseInt(config.bid.increment),
      rekeyAccount,
      parseInt(config.endAuctionSeconds),
      causeWallet,
      creatorWallet,
      causePercentaje,
      creatorPercentaje
    )
    const appIndex = auction['application-index']
    this.logger.info(
      `Auction created by ${rekeyAccount.addr} is ${appIndex} ${config.algoExplorerApi}/application/${appIndex}`
    )
    const appAddr = this._getApplicationAddressFromAppIndex(appIndex)
    this.logger.info(`App wallet is ${appAddr}`)
    // const appAddr = algosdk.getApplicationAddress(appIndex)
    // console.log(
    //   `Opting in asset ${assetId} for account ${appAddr} (Signed by ${this.account.account.addr})`
    // )
    // const result = await this.optInService.optInAssetByID(
    //   assetId,
    //   appAddr,
    //   undefined,
    //   this.account.account
    // )
    // console.log(
    //   `Asset ${assetId} opted in into ${appAddr}[appIndex:${appIndex}]:`,
    //   result
    // )
    const { amount } = await this.auctionLogic.fundAuction(appIndex)
    this.logger.info(`Application funded with ${amount}`)
    await this.auctionLogic.makeAppCallSetupProc(appIndex, assetId)
    this.logger.info(`Asset opted in!`)
    const note = algosdk.encodeObj({
      ...asset,
      arc69: {
        ...asset.arc69,
        properties: {
          ...asset.arc69.properties,
          app_id: appIndex,
        },
      },
    })
    await this.auctionLogic.makeTransferToApp(appIndex, assetId, note)
    this.logger.info(`Asset ${assetId} transferred to ${appIndex}`)

    return appIndex
  }

  async generateRekeyAccount() {
    const rekeyAccount = this._generateRekeyAccount()
    appendFileSync(
      '.temp.accounts',
      `${rekeyAccount.addr} ${algosdk.secretKeyToMnemonic(rekeyAccount.sk)}\n`
    )
    this.logger.info(`Dumping temporary account information:`, rekeyAccount.addr)
    this.logger.info(`Paying fees for temp ${rekeyAccount.addr}...`)
    await this._payMinimumTransactionFeesToRekeyAccount(rekeyAccount)
    this.logger.info(`Rekeying temporary account...`)
    const rekeyTransaction = await this._rekeyingTemporaryAccount(rekeyAccount)
    await this.op.signAndConfirm(rekeyTransaction, undefined, rekeyAccount)

    return rekeyAccount
  }

  private _getApplicationAddressFromAppIndex(appIndex: number) {
    return algosdk.getApplicationAddress(appIndex)
  }

  private async _rekeyingTemporaryAccount(rekeyAccount: algosdk.Account) {
    const suggestedParams: algosdk.SuggestedParams =
      await this._getSuggestedParams()

    return await algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: rekeyAccount.addr,
      to: rekeyAccount.addr,
      suggestedParams,
      amount: 0,
      rekeyTo: this.account.account.addr,
    })
  }

  private async _payMinimumTransactionFeesToRekeyAccount(
    rekeyAccount: algosdk.Account
  ) {
    const microAlgosForFees = 1000000
    await this.op.pay(
      this.account.account,
      rekeyAccount.addr,
      microAlgosForFees
    )
  }
  private _generateRekeyAccount() {
    return algosdk.generateAccount()
  }
  private async _getSuggestedParams() {
    return await this.client.client.getTransactionParams().do()
  }

  private async _getCauseInfo(causeId: string) {
    this.logger.info(`getting causes info.... causeId ${config.apiUrlCauses}causes/${causeId}`)
    const cause = await axios.get(
      `${config.apiUrlCauses}/causes/${causeId}`,
      {
        headers: {
          accept: 'application/json',
        },
      }
    )
    this.logger.info('getting causes percentajes....')
    const percentages = await axios.get(
      `${config.apiUrlCauses}/causes/config`,
      {
        headers: {
          accept: 'application/json',
        },
      }
    )

    return {
      cause, percentages
    }
  }
}
