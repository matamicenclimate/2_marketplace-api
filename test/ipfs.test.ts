import request from 'supertest'
import server from './testSupport/server'
const ipfsFilePath = __dirname + '/testSupport/ipfs.png'

const SUCCESS = 200

describe('IPFS', () => {
	test('Can be upload ', async () => {
    const body = {
      title: 'Upload File',
      description: 'First file description',
      author: 'Author of First upload file'
    }
		const response = await request(server)
      .post(`/api/${process.env.RESTAPI_VERSION}/ipfs`)
      .field('data', JSON.stringify(body))
      .attach('file', ipfsFilePath)
    console.log(response)
		expect(response.statusCode).toBe(SUCCESS)
	})
})