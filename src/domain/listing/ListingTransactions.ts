import { AuctionLogic } from "@common/services/AuctionLogic"
import algosdk, { TransactionLike } from "algosdk"
import CustomLogger from "src/infrastructure/CustomLogger"
import Container from "typedi"
import * as WalletAccountProvider from '@common/services/WalletAccountProvider'
import AlgodClientProvider from "@common/services/AlgodClientProvider"
const OPT_IN_AMOUNT = 0

export default class ListingTransactions {
  readonly auctionLogic: AuctionLogic
  private logger: CustomLogger
  public transactions: TransactionLike[]
  readonly walletProvider: WalletAccountProvider.type
  readonly clientProvider: AlgodClientProvider

  constructor () {
    this.auctionLogic = Container.get(AuctionLogic)
    this.clientProvider = Container.get(AlgodClientProvider)
    this.walletProvider = WalletAccountProvider.get()
    this.logger = new CustomLogger()
    this.transactions = []
  }

  async addApplicationCall (appIndex: number, assetId: number) {
    const appCallTxn = await this.auctionLogic.makeAppCallSetupProcWithoutConfirm(appIndex, assetId)
    this.transactions.push(appCallTxn)
  }

  async addOptInRequest(
    assetId: number,
    sender: string = this.walletProvider.account.addr,
    recipient = sender,
    ammout = OPT_IN_AMOUNT
  ) {
    const params = await this.client.getTransactionParams().do()
    const revocationTarget = undefined
    const closeRemainderTo = undefined
    const note = undefined
    const amount = ammout
    console.log(`[OPT IN]\nsender = ${sender}\nrecipient = ${recipient}`)
    const optInTxnUnsigned = await algosdk.makeAssetTransferTxnWithSuggestedParams(
      sender,
      recipient,
      closeRemainderTo,
      revocationTarget,
      amount,
      note,
      assetId,
      params
    )
    this.transactions.push(optInTxnUnsigned)
  }

  async makeTransferTransactions (appIndex: number, assetId: number, note: Uint8Array) {
    const makeTransferTransactions = await this.auctionLogic.makeTransferToAppWithoutConfirm(appIndex, assetId, note)
    if (Array.isArray(makeTransferTransactions) && makeTransferTransactions.length) {
      this.transactions.push(...makeTransferTransactions)
    }
  }

  async addFundListing (appIndex: number) {
    const { amount, fundTxn } = await this.auctionLogic.fundListingWithoutConfirm(appIndex)
    this.transactions.push(fundTxn)
    this.logger.info(`Application will be funded with ${amount} amount`)
  }

  async signTxn (unsignedTxn: algosdk.Transaction, walletSecretKey = this.walletProvider.account.sk): Promise<Uint8Array> {
    return unsignedTxn.signTxn(walletSecretKey)
  }
  encodeUnsignedTxn(txn: algosdk.Transaction) {
    return algosdk.encodeUnsignedTransaction(txn)
  }
  private get client() {
    return this.clientProvider.client
  }

}