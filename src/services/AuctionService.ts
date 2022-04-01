import AlgodClientProvider from '@common/services/AlgodClientProvider'
import { AuctionLogic } from '@common/services/AuctionLogic'
import OptInService from '@common/services/OptInService'
import config from 'src/config/default'
import Container, { Service } from 'typedi'
import algosdk from 'algosdk'
import { appendFileSync } from 'fs'
import * as WalletAccountProvider from '@common/services/WalletAccountProvider'
import { TransactionOperation } from '@common/services/TransactionOperation'

@Service()
export default class AuctionService {
  readonly auctionLogic: AuctionLogic
  readonly optInService: OptInService
  readonly client: AlgodClientProvider
  readonly account: WalletAccountProvider.type
  readonly op: TransactionOperation

  constructor() {
    this.optInService = Container.get(OptInService)
    this.auctionLogic = Container.get(AuctionLogic)
    this.client = Container.get(AlgodClientProvider)
    this.account = WalletAccountProvider.get()
    this.op = Container.get(TransactionOperation)
  }

  async execute(assetId: number, reserve: number) {
    const temp = algosdk.generateAccount()
    appendFileSync(
      '.temp.accounts',
      `${temp.addr} ${algosdk.secretKeyToMnemonic(temp.sk)}\n`
    )
    console.log(`Dumping temporary account information:`, temp.addr)
    const suggestedParams = await this.client.client.getTransactionParams().do()
    console.log(`Paying fees for temp ${temp.addr}...`)
    await this.op.pay(this.account.account, temp.addr, 1000000)
    console.log(`Rekeying temporary account...`)
    const r = await algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: temp.addr,
      to: temp.addr,
      suggestedParams,
      amount: 0,
      rekeyTo: this.account.account.addr,
    })
    await this.op.signAndConfirm(r, undefined, temp)
    console.log(`Creating auction`)
    const auction = await this.auctionLogic.createAuction(
      assetId,
      reserve,
      parseInt(config.bid.increment),
      temp
    )
    const appIndex = auction['application-index']
    console.log(
      `Auction created by ${temp.addr} is ${appIndex} https://testnet.algoexplorer.io/application/${appIndex}`
    )
    const appAddr = algosdk.getApplicationAddress(appIndex)
    console.log(`App wallet is ${appAddr}`)
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
    console.log(`Application funded with ${amount}`)
    await this.auctionLogic.makeAppCallSetupProc(appIndex, assetId)
    console.log(`Asset opted in!`)
    await this.auctionLogic.makeTransferToApp(appIndex, assetId)
    console.log(`Asset ${assetId} transferred to ${appIndex}`)
    return {
      appIndex,
    }
  }
}
