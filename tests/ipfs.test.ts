import request from 'supertest'
import { expect } from 'chai'
import sinon from 'sinon'
import { NFTStorage } from 'nft.storage'
import server from './testSupport/server'
const ipfsFilePath = __dirname + '/testSupport/ipfs.png'

import { nftStorageResponse } from './testSupport/mocks'

const SUCCESS = 200
const BAD_REQUEST = 400

beforeEach(() => {
  sinon.restore()
})
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
        expect(response.statusCode).to.eq(SUCCESS)
        expect(response.body.ipnft).to.be.eq(nftStorageResponse.ipnft)
        expect(response.body.url).to.be.eq(nftStorageResponse.url)
        expect(response.body.image_url).to.be.eq('https://cloudflare-ipfs.com/ipfs/bafybeic7bjx2tjm2aqug3hcr7gbylzsnjiakhgwkbznurt2r3rm7ye3z74/ipfs.png')
        expect(response.body.data).to.deep.eq(nftStorageResponse.data)
        expect(response.body.arc69.standard).to.be.eq('arc69')
        expect(response.body.arc69.description).to.be.eq(nftStorageResponse.data.description)
        expect(response.body.arc69.external_url).to.be.eq(nftStorageResponse.data.image.href)
        expect(response.body.arc69.mime_type).to.be.eq(nftStorageResponse.data.properties.file.type)
        expect(response.body.arc69.properties).to.deep.eq(nftStorageResponse.data.properties)
      }).then(done).catch(done)
  })
  describe('Errors', () => {
    it('on store of NFTStorage class', (done) => {
      sinon.stub(NFTStorage.prototype, 'store').callsFake(() => {
        throw new Error('Cannot store')
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
          try {
            expect(response.statusCode).to.eq(SUCCESS)
          } catch (error) {
            expect(response.statusCode).to.eq(BAD_REQUEST)
            expect(response.body.status).to.be.eq('ko')
            expect(response.body.message).to.be.eq("Calling store of 'NFTStorage' error: Cannot store")
            expect(response.body.code).to.eq(BAD_REQUEST)
            expect(Boolean(response.body.stack)).to.be.true
          }
        }).then(done).catch(done)
    })
  })
})