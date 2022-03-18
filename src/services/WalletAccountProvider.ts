import algosdk, { Account } from 'algosdk'
import { Service } from 'typedi'
import config from '../config/default'

/**
 * This service will provide at any time an available wallet, ready for use.
 */
@Service()
export default class WalletProvider {
  readonly account: Account

  constructor() {
    const { nemonic } = config.defaultWallet
    this.account = algosdk.mnemonicToSecretKey(nemonic)
  }
}
