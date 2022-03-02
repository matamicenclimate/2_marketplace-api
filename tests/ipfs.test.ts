import request from 'supertest'
import { expect } from 'chai'
import sinon from 'sinon'
import { NFTStorage } from 'nft.storage'
import server from './testSupport/server'
const ipfsFilePath = __dirname + '/testSupport/ipfs.png'

const SUCCESS = 200
describe('IPFS', () => {

  it('Can be upload', (done) => {
    const result = {
      ipnft: 'bafyreie3f76qjzelgeboxr3rikzfi6iabs2xj7nt4qfqmflaauepka7opm',
      url: 'ipfs://bafyreie3f76qjzelgeboxr3rikzfi6iabs2xj7nt4qfqmflaauepka7opm/metadata.json',
      data: {
        name: 'Upload File',
        description: 'First file description',
        properties: {
          file: { name: 'ipfs.png', type: 'image/png', size: 2842 },
          artist: 'Author of First upload file'
        },
        image: {
          href: 'ipfs://bafybeic7bjx2tjm2aqug3hcr7gbylzsnjiakhgwkbznurt2r3rm7ye3z74/ipfs.png',
          origin: 'null',
          protocol: 'ipfs:',
          username: '',
          password: '',
          host: 'bafybeic7bjx2tjm2aqug3hcr7gbylzsnjiakhgwkbznurt2r3rm7ye3z74',
          hostname: 'bafybeic7bjx2tjm2aqug3hcr7gbylzsnjiakhgwkbznurt2r3rm7ye3z74',
          port: '',
          pathname: '/ipfs.png',
          search: '',
          searchParams: {},
          hash: ''
        }
      } 
    }
    sinon.stub(NFTStorage.prototype, 'store').callsFake(() => {
			return new Promise((resolve, reject) => {
				resolve(result as any)
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
        expect(response.body).to.deep.eq(result)
      }).then(done)
  })
})