import request from 'supertest'
import { expect } from 'chai'
import sinon from 'sinon'
import { NFTStorage } from 'nft.storage'
import server from './testSupport/server'
const ipfsFilePath = __dirname + '/testSupport/ipfs.png'

import { nftStorageResponse } from './testSupport/mocks'

const SUCCESS = 200
const BAD_REQUEST = 400
const body = {
  title: 'Title - Upload File',
  description: 'First file description',
  author: 'Author of First upload file',
  price: 100,
  properties: {
    cause: 'Cause property',
    causePercentage: 50,
    prop1: 'Prop1 property',
    prop2: 'Prop2 property'
  }
}

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

    request(server)
      .post(`/api/${process.env.RESTAPI_VERSION}/ipfs`)
      .field('data', JSON.stringify(body))
      .attach('file', ipfsFilePath)
      .then(response => {
        expect(response.statusCode).to.eq(SUCCESS)
        expect(response.body.ipnft).to.be.eq(nftStorageResponse.ipnft)
        expect(response.body.url).to.be.eq(nftStorageResponse.url)
        expect(response.body.title).to.be.eq(nftStorageResponse.title)
        expect(response.body.image_url).to.be.eq('https://cloudflare-ipfs.com/ipfs/bafybeic7bjx2tjm2aqug3hcr7gbylzsnjiakhgwkbznurt2r3rm7ye3z74/ipfs.png')
        expect(response.body.arc69).to.deep.eq(nftStorageResponse.arc69)
        expect(response.body.arc69.standard).to.be.eq('arc69')
        expect(response.body.arc69.description).to.be.eq(nftStorageResponse.arc69.description)
        expect(response.body.arc69.mime_type).to.be.eq(nftStorageResponse.arc69.properties.file.type)
        expect(response.body.arc69.properties.file).to.deep.eq(nftStorageResponse.arc69.properties.file)
        expect(response.body.arc69.properties.price).to.deep.eq(nftStorageResponse.arc69.properties.price)
        expect(response.body.arc69.properties.artist).to.be.eq(nftStorageResponse.arc69.properties.artist)
        expect(response.body.arc69.properties.cause).to.be.eq(nftStorageResponse.arc69.properties.cause)
        expect(response.body.arc69.properties.causePercentage).to.be.eq(nftStorageResponse.arc69.properties.causePercentage)
        expect(response.body.arc69.properties.prop1).to.be.eq(nftStorageResponse.arc69.properties.prop1)
        expect(Boolean(response.body.arc69.properties.date)).to.be.true
        expect(response.body.data).to.deep.eq(nftStorageResponse.data)
      }).then(done).catch(done)
  })
  describe('Errors', () => {
    it('on store of NFTStorage class', (done) => {
      sinon.stub(NFTStorage.prototype, 'store').callsFake(() => {
        throw new Error('Cannot store')
      });

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
  
    it('on invalid reques params', (done) => {
      const wrongBody = {
        title: 'Title - Upload File',
        description: 'First file description',
        author: 'Author of First upload file',
        properties: {
          cause: 20,
          causePercentage: 'should be a number',
        }
      }

      request(server)
        .post(`/api/${process.env.RESTAPI_VERSION}/ipfs`)
        .field('data', JSON.stringify(wrongBody))
        .attach('file', ipfsFilePath)
        .then(response => {
          try {
            expect(response.statusCode).to.eq(SUCCESS)
          } catch (error) {
            expect(response.statusCode).to.eq(BAD_REQUEST)
            expect(response.body.message).to.be.eq('Invalid input parameters')
          }
        }).then(done).catch(done)
    })
  })
})