import * as AlgodConfigProvider from '@common/services/AlgodConfigProvider'
import config from '../../config/default'

@AlgodConfigProvider.declare()
export default class EnvAlgodConfigProvider implements AlgodConfigProvider.type {
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
