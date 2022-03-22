import { Inject, Service } from 'typedi'

/**
 * Abstract configuration provider for Algod client lazy factory.
 */
export default interface AlgodConfigProvider {
  get port(): number | ''
  get token(): string
  get server(): string
}

export const ALGOD_CONFIG_PROVIDER_ID = 'algod-config'

export const AlgodConfigProviderDecorators = {
  Inject: () => Inject(ALGOD_CONFIG_PROVIDER_ID),
  Service: () => Service(ALGOD_CONFIG_PROVIDER_ID),
}
