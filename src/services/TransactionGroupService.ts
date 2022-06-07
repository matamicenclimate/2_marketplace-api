import AlgodClientProvider from '@common/services/AlgodClientProvider'
import Container, { Inject, Service } from 'typedi'
import algosdk, { TransactionLike } from 'algosdk'
import CustomLogger from 'src/infrastructure/CustomLogger'
import * as TransactionSigner from '@common/services/TransactionSigner'

@Service()
export default class TransactionGroupService {
  readonly client: AlgodClientProvider
  @Inject()
  private readonly logger!: CustomLogger
  @TransactionSigner.inject() 
  readonly signer: TransactionSigner.type

  constructor() {
    this.client = Container.get(AlgodClientProvider)
  }

  async execute(transactions: TransactionLike[]) {
    this.logger.info('Grouping transactions', {
      transactions
    })
    const txns = algosdk.assignGroupID(transactions)
    const signedTxn = await this.signer.signTransaction(txns)
    const { txId } = await this.client.client.sendRawTransaction(signedTxn).do()
    await algosdk.waitForConfirmation(this.client.client, txId, 9)
    return txId
  }
}
