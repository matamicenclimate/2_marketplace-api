import request from 'supertest'
import { expect } from 'chai'
import sinon from 'sinon'
import algosdk from 'algosdk'
import server from './testSupport/server'
import OptInService from '@common/services/OptInService'
import CustomTransactionSigner from 'src/services/impl/CustomTransactionSigner'
import { responseOptInService } from './testSupport/mocks'
import DefaultWalletProvider from 'src/services/impl/DefaultWalletProvider'
import ListingService from 'src/services/ListingService'
import { AuctionLogic } from '@common/services/AuctionLogic'
import { AuctionCreationResult } from '@common/lib/AuctionCreationResult'

const SUCCESS = 200
beforeEach(() => {
  sinon.restore()
})
describe('Mint', () => {
  it('assets by asset id', async () => {
    const assetId = responseOptInService.txn.txn.xaid
    stubOptInProcess()

    const response = await request(server)
      .post(`/api/${process.env.RESTAPI_VERSION}/opt-in`)
      .send({
        assetId
      })
    expect(response.statusCode).to.eq(SUCCESS)
    expect(response.body.appIndex).to.eq(242354235)
  })
})

const stubOptInProcess = () => {
  sinon.stub(AuctionLogic.prototype, 'createAuction').resolves({
    'application-index': 242354235
  } as AuctionCreationResult)
  sinon.stub(AuctionLogic.prototype, 'fundAuction').resolves({
    txId: 20942,
  } as { txId: number; result: Record<string, unknown>; })
  sinon.stub(AuctionLogic.prototype, 'makeAppCallSetupProc').resolves({
    txId: 20942,
  } as { txId: number; result: Record<string, unknown>; })
  sinon.stub(ListingService.prototype, 'populateAsset').resolves(true)
  sinon.stub(ListingService.prototype, 'normalizeAsset').resolves(
    {
      arc69: {
        description: 'dafd',
        external_url: 'ipfs://bafybeihhargel6lngmkyhuhdfxfsyq5c2krs442f5ujit2vkfymjgebvpe/1641997247445.jpg',
        mime_type: 'image/jpeg',
        properties: {
          artist: 'fadfd',
          cause: 'Causa benefica developers',
          causePercentage: 30,
          date: '2022-03-28T09:24:44.271Z',
          file: [Object],
          price: 57
        },
        standard: 'arc69'
      },
      image_url: 'https://cloudflare-ipfs.com/ipfs/bafybeihhargel6lngmkyhuhdfxfsyq5c2krs442f5ujit2vkfymjgebvpe/1641997247445.jpg',
      ipnft: 'bafyreihwepvmnt5gbh6rtxbkftk5a7ztdzef7as3auaqobedbyzlkhzqyq',
      title: 'asd',
      url: 'ipfs://bafyreihwepvmnt5gbh6rtxbkftk5a7ztdzef7as3auaqobedbyzlkhzqyq/metadata.json'
    }
  )
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