import 'reflect-metadata'
import { expect } from 'chai'
import request from 'supertest'
import server from './testSupport/server'
import axios from 'axios'
import sinon from 'sinon'
import config from 'src/config/default'
import { assetNormalized, auctionAppState, responseOptInService } from './testSupport/mocks'
import CloseAuction from 'src/services/CloseAuction'
import { AssetNormalized } from 'src/interfaces'
import { TransactionOperation } from '@common/services/TransactionOperation'
import algosdk from 'algosdk'
import Container from 'typedi'
import FindRekey from 'src/services/FindRekeyService'
import DbConnectionService from 'src/services/DbConnectionService'
import RekeyAccountRecord from 'src/domain/model/RekeyAccount'
import { stubCreateAuction } from './testSupport/stubs'

const SUCCESS = 200
const assetId = 69586371
afterEach(async () => {
  const connection = await DbConnectionService.create()
  await connection.createQueryBuilder().delete().from(RekeyAccountRecord).execute()
  await connection.destroy()
})
describe('Close Auction', () => {
  it('updates isClosedAuction field', async () => {
    const closeAuction = Container.get(CloseAuction)
    await prepareCloseAuctionStub()
    const result = await closeAuction.execute([assetNormalized as unknown as AssetNormalized])
    const findRekey = new FindRekey()
    const rekey = await findRekey.execute()
    expect(rekey[0].applicationId).to.equal(assetNormalized.arc69.properties.app_id)
    expect(rekey[0].isClosedAuction).to.be.equal(true)
  })
})

const prepareCloseAuctionStub = async () => {
  const assetId = responseOptInService.txn.txn.xaid
    stubCreateAuction(assetId)
    sinon.stub(TransactionOperation.prototype, 'getApplicationState').resolves(auctionAppState)
    sinon.stub(algosdk.Algodv2.prototype, 'getTransactionParams').returns({
      do: () => { }
    } as any)
    sinon.stub(CloseAuction.prototype, '_deleteTransactionToCloseAuction').resolves({
      txId: 20942,
    } as { txId: number; result: Record<string, unknown>; })
    sinon.stub(TransactionOperation.prototype, 'closeReminderTransaction').resolves({
      txId: 20942,
    } as { txId: number; result: Record<string, unknown>; })
    const response = await request(server)
            .post(`/api/${process.env.RESTAPI_VERSION}/create-auction`)
            .send({
                assetId,
                creatorWallet: 'creator-wallet',
                causePercentage: '50',
                startDate: new Date().toISOString(),
                endDate: new Date('2023-04-26T08:40:58.338Z').toISOString()
            })
}