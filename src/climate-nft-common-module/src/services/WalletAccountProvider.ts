import { Account } from 'algosdk'
import { Inject, Service } from 'typedi'

/**
 * Provides an account
 */
export default interface WalletAccountProvider {
  get account(): Account
}

export const WALLET_ACCOUNT_PROVIDER_ID = 'wallet-provider'

export const WalletAccountProviderDecorators = {
  Inject: () => Inject(WALLET_ACCOUNT_PROVIDER_ID),
  Service: () => Service(WALLET_ACCOUNT_PROVIDER_ID),
}
