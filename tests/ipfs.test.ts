import request from 'supertest'
import { expect } from 'chai'
import sinon from 'sinon'
import { NFTStorage } from 'nft.storage'
import server from './testSupport/server'
const ipfsFilePath = __dirname + '/testSupport/ipfs.png'

import { nftStorageResponse } from './testSupport/mocks'

const SUCCESS = 200
describe('IPFS', () => {
  it('Can be upload', (done) => {
    sinon.stub(NFTStorage.prototype, 'store').callsFake(() => {
			return new Promise((resolve, reject) => {
				resolve(nftStorageResponse as any)
			})
		});
    const body = {
      title: 'Upload File',
      description: 'First file description',
      author: 'Author of First upload file'
    }
    request(server)
      .post(`/api/${process.env.RESTAPI_VERSION}/ipfs`)
      .field('data', JSON.stringify(body))
      .attach('file', ipfsFilePath)
      .then(response => {
        expect(response.body.ipnft).to.be.eq(nftStorageResponse.ipnft)
        expect(response.body.url).to.be.eq(nftStorageResponse.url)
        expect(response.body.data).to.deep.eq(nftStorageResponse.data)
        expect(response.body.arc69.standard).to.be.eq('arc69')
        expect(response.body.arc69.description).to.be.eq(nftStorageResponse.data.description)
        expect(response.body.arc69.external_url).to.be.eq(nftStorageResponse.data.image.href)
        expect(response.body.arc69.mime_type).to.be.eq(nftStorageResponse.data.properties.file.type)
        expect(response.body.arc69.properties).to.deep.eq(nftStorageResponse.data.properties)
      }).then(done).catch(done)
  })
})