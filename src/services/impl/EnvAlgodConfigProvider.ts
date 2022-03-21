import AlgodConfigProvider, {
  AlgodConfigProviderDecorators,
} from '@common/services/AlgodConfigProvider'

@AlgodConfigProviderDecorators.Service()
export default class EnvAlgodConfigProvider implements AlgodConfigProvider {
  get port(): number | '' {
    return ''
  }
  get token(): string {
    return 'uwMK5eEd2i52PCM6FOVGY2rQTA5gy0pr52IOAREF'
  }
  get server(): string {
    return 'https://testnet-algorand.api.purestake.io/ps2'
  }
}
