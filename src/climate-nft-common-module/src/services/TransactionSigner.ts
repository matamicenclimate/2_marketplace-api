import { Transaction } from 'algosdk'
import { Inject, Service } from 'typedi'

/**
 * An abstraction that allows sevices to sign transactions.
 */
export default interface TransactionSigner {
  /**
   * Signs a single transaction, by using an implementation-dependent wallet.
   */
  signTransaction(transaction: Transaction): Promise<Uint8Array>
}

export const TRANSACTION_SIGNER_ID = 'transaction-signer'

export const TransactionSignerDecorators = {
  Inject: () => Inject(TRANSACTION_SIGNER_ID),
  Service: () => Service(TRANSACTION_SIGNER_ID),
}
