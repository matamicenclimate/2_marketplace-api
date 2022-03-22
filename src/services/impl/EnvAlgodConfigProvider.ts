import AlgodConfigProvider, {
  AlgodConfigProviderDecorators,
} from '../../climate-nft-common-module/src/services/AlgodConfigProvider'
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
    return config.algoClientServer
  }
}
