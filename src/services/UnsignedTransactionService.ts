import AlgodClientProvider from '@common/services/AlgodClientProvider'
import Container, { Inject, Service } from 'typedi'
import algosdk from 'algosdk'
import CustomLogger from 'src/infrastructure/CustomLogger'

@Service()
export default class UnsignedTransactionService {
  readonly client: AlgodClientProvider
  @Inject()
  private readonly logger!: CustomLogger

  constructor() {
    this.client = Container.get(AlgodClientProvider)
  }

  async execute(
    marketplaceAddress: string,
    targetWallet: string,
    amount: number
  ) {
    this.logger.info('Making transaction', {
      marketplaceAddress, targetWallet, amount
    })
    const suggestedParams = await this.client.client.getTransactionParams().do()

    const depostitTxUnsigned = await algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: marketplaceAddress,
      to: targetWallet,
      amount,
      suggestedParams,
    })

    return depostitTxUnsigned
  }
}
