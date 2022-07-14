import { AuctionLogic } from '@common/services/AuctionLogic'
import algosdk, { TransactionLike } from 'algosdk'
import CustomLogger from 'src/infrastructure/CustomLogger'
import Container from 'typedi'
import * as WalletAccountProvider from '@common/services/WalletAccountProvider'
import AlgodClientProvider from '@common/services/AlgodClientProvider'

export default class ListingTransactions {
  readonly auctionLogic: AuctionLogic
  private logger: CustomLogger
  public transactions: TransactionLike[]
  readonly walletProvider: WalletAccountProvider.type
  readonly clientProvider: AlgodClientProvider

  constructor() {
    this.auctionLogic = Container.get(AuctionLogic)
    this.clientProvider = Container.get(AlgodClientProvider)
    this.walletProvider = WalletAccountProvider.get()
    this.logger = new CustomLogger()
    this.transactions = []
  }

  async addApplicationCall(appIndex: number, assetId: number) {
    const appCallTxn =
      await this.auctionLogic.makeAppCallSetupProcWithoutConfirm(
        appIndex,
        assetId
      )
    this.transactions.push(appCallTxn)
  }

  /**
   * ### Opts an asset in
   *
   * When no sender, recipient and amount is specified, the transfer is considered
   * an **opt-in**.
   */
  async addAssetTransferRequest(assetId: number): Promise<void>
  /**
   * ### Transfers an asset
   *
   * Transfers the _amount_ of an asset to _recipient_ from _sender_.
   */
  async addAssetTransferRequest(
    assetId: number,
    sender: string,
    recipient: string,
    amount: number
  ): Promise<void>
  async addAssetTransferRequest(
    assetId: number,
    sender: string = this.walletProvider.account.addr,
    recipient = sender,
    amount = 0
  ): Promise<void> {
    const params = await this.client.getTransactionParams().do()
    const revocationTarget = undefined
    const closeRemainderTo = undefined
    const note = undefined
    console.log(`[TRANSACTION]\nsender = ${sender}\nrecipient = ${recipient}`)
    const txn = await algosdk.makeAssetTransferTxnWithSuggestedParams(
      sender,
      recipient,
      closeRemainderTo,
      revocationTarget,
      amount,
      note,
      assetId,
      params
    )
    this.transactions.push(txn)
  }

  async addAssetOptInRequest(assetId: number) {
    return await this.addAssetTransferRequest(assetId)
  }

  async makeTransferTransactions(
    appIndex: number,
    assetId: number,
    note: Uint8Array
  ) {
    const makeTransferTransactions =
      await this.auctionLogic.makeTransferToAppWithoutConfirm(
        appIndex,
        assetId,
        note
      )
    if (
      Array.isArray(makeTransferTransactions) &&
      makeTransferTransactions.length
    ) {
      this.transactions.push(...makeTransferTransactions)
    }
  }

  async addFundListing(appIndex: number) {
    const { amount, fundTxn } =
      await this.auctionLogic.fundListingWithoutConfirm(appIndex)
    this.transactions.push(fundTxn)
    this.logger.info(`Application will be funded with ${amount} amount`)
  }

  async signTxn(
    unsignedTxn: algosdk.Transaction,
    walletSecretKey = this.walletProvider.account.sk
  ): Promise<Uint8Array> {
    return unsignedTxn.signTxn(walletSecretKey)
  }
  encodeUnsignedTxn(txn: algosdk.Transaction) {
    return algosdk.encodeUnsignedTransaction(txn)
  }
  private get client() {
    return this.clientProvider.client
  }
}
