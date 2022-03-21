import WalletAccountProvider, {
  WalletAccountProviderDecorators,
} from '@common/services/WalletAccountProvider'
import algosdk, { Account } from 'algosdk'
import config from '../../config/default'

/**
 * This service will provide at any time an available wallet, ready for use.
 */
@WalletAccountProviderDecorators.Service()
export default class DefaultWalletProvider implements WalletAccountProvider {
  readonly account: Account
  static mnemonicToSecretKey = algosdk.mnemonicToSecretKey
  constructor() {
    const { nemonic } = config.defaultWallet
    this.account = DefaultWalletProvider.mnemonicToSecretKey(nemonic)
  }
}
