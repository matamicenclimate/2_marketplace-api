import { Service } from 'typedi'
import algosdk from 'algosdk'
import AlgodConfigProvider, {
  AlgodConfigProviderDecorators,
} from './AlgodConfigProvider'

@Service()
export default class AlgodClientProvider {
  readonly client: algosdk.Algodv2

  constructor(
    @AlgodConfigProviderDecorators.Inject()
    readonly config: AlgodConfigProvider
  ) {
    const token = {
      'x-api-key': this.config.token,
    }
    const { server, port } = this.config
    this.client = new algosdk.Algodv2(token, server, port)
  }
}
