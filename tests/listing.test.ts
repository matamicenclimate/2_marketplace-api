import { expect } from 'chai'
import request from 'supertest'
import server from './testSupport/server'
import axios from 'axios'
import sinon from 'sinon'
import { assets, populatedAsset } from './testSupport/mocks'

const SUCCESS = 200

describe('Listing', () => {
  it('can recover assets', async () => {
    sinon.stub(axios, 'get').callsFake((url: string): Promise<unknown> => {
      if (url.includes('https://testnet-algorand.api.purestake.io/idx2/v2/accounts')) return Promise.resolve(assets)
      if (url === 'https://testnet-algorand.api.purestake.io/idx2/v2/assets/69586371/transactions') return Promise.resolve(populatedAsset)
      return Promise.resolve({})
    })
    const listingResponse = await request(server).get(
      `/api/${process.env.RESTAPI_VERSION}/nfts`
    )

    expect(listingResponse.statusCode).to.eq(SUCCESS)
    expect(Boolean(listingResponse.body[0].arc69)).to.be.true
    expect(listingResponse.body[0].image_url).to.eq('https://cloudflare-ipfs.com/ipfs/bafybeihhargel6lngmkyhuhdfxfsyq5c2krs442f5ujit2vkfymjgebvpe/1641997247445.jpg')
    expect(listingResponse.body[0].title).to.eq('dafdf')

  })
})
