import request from 'supertest'
import { expect } from 'chai'
import sinon from 'sinon'
import algosdk from 'algosdk'
import server from './testSupport/server'
import OptInService from '@common/services/OptInService'
import CustomTransactionSigner from 'src/services/impl/CustomTransactionSigner'
import { responseOptInService } from './testSupport/mocks'
import DefaultWalletProvider from 'src/services/impl/DefaultWalletProvider'

const SUCCESS = 200
beforeEach(() => {
  sinon.restore()
})
describe('Mint', () => {
  it('assets by asset id', async () => {
    const assetId = responseOptInService.txn.txn.xaid
    stubOptInProcess()

    const response = await request(server)
      .post(`/api/${process.env.RESTAPI_VERSION}/opt-in/${assetId}`)

    expect(response.statusCode).to.eq(SUCCESS)
    expect(response.body).to.deep.eq(responseOptInService)
  })
})

const stubOptInProcess = () => {
  const transactionSign = new Uint8Array()
  sinon.stub(CustomTransactionSigner.prototype, '_signTransaction').resolves(transactionSign)
  sinon.stub(algosdk, 'mnemonicToSecretKey').resolves(Promise.resolve({
    account: {
      addr: 'account'
    }
  }))
  sinon.stub(algosdk.Algodv2.prototype, 'getTransactionParams').returns({
    do: () => { }
  } as any)
  sinon.stub(algosdk.Algodv2.prototype, 'sendRawTransaction').returns({
    do: () => ({ txId: 'txId' })
  } as any)
  sinon.stub(OptInService, 'makeAssetTransferTransaction').resolves(true)
  sinon.stub(DefaultWalletProvider, 'mnemonicToSecretKey').resolves(true)
  sinon.stub(OptInService, 'waitForConfirmation').resolves(responseOptInService)
}