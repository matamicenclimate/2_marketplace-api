import request from 'supertest'
import server from './testSupport/server'

const SUCCESS = 200
const BAD_REQUEST = 400

describe.skip('Listing', () => {
  it('can recover assets', async () => {
    const listingResponse = await request(server).get(
      `/api/${process.env.RESTAPI_VERSION}/nfts`
    )
  })
})
