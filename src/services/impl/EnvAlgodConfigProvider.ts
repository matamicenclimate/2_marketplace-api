import AlgodConfigProvider, {
  AlgodConfigProviderDecorators,
} from '@common/services/AlgodConfigProvider'
import config from 'src/config/default'

@AlgodConfigProviderDecorators.Service()
export default class EnvAlgodConfigProvider implements AlgodConfigProvider {
  get port(): number | '' {
    return ''
  }
  get token(): string {
    return config.algoClientApiKey
  }
  get server(): string {
    return 'https://testnet-algorand.api.purestake.io/ps2'
  }
}
