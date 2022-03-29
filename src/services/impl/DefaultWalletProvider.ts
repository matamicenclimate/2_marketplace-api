import * as WalletAccountProvider from '@common/services/WalletAccountProvider'
import algosdk, { Account } from 'algosdk'
import config from '../../config/default'

/**
 * This service will provide at any time an available wallet, ready for use.
 */
@WalletAccountProvider.declare()
export default class DefaultWalletProvider implements WalletAccountProvider.type {
  readonly account: Account
  static mnemonicToSecretKey = algosdk.mnemonicToSecretKey
  constructor() {
    const { nemonic } = config.defaultWallet
    this.account = DefaultWalletProvider.mnemonicToSecretKey(nemonic)
  }
}
