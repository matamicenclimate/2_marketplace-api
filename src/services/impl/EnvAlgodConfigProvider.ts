import AlgodConfigProvider, {
  AlgodConfigProviderDecorators,
} from '@common/services/AlgodConfigProvider'
import config from '../../config/default'

@AlgodConfigProviderDecorators.Service()
export default class EnvAlgodConfigProvider implements AlgodConfigProvider {
  get port(): number | '' {
    return ''
  }
  get token(): string {
    return config.algoClientApiKey
  }
  get server(): string {
    return config.algoClientServer
  }
}
