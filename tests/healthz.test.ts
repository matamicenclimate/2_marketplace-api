process.env.NODE_ENV = 'testing'
process.env.RESTAPI_PORT = '4000'
import { loadEnvVars } from '../src/infrastructure/environment'
loadEnvVars()

import request from 'supertest'
import { expect } from 'chai'
import sinon from 'sinon'
import server from './testSupport/server'
import HealthzService from '../src/services/HealthzService'
import Container from 'typedi'

const SUCCESS = 200
const SERVER_ERROR = 500

describe.skip('api', () => {

	it('Server is available', async () => {
		const response = await request(server)
			.get(`/api/${process.env.RESTAPI_VERSION}/healthz`)

		expect(response.statusCode).to.eq(SUCCESS)
		expect(response.body.status).to.be.eq('ok')
	})
	it('Server is not available', async () => {
		const service = Container.get(HealthzService)
		sinon.stub(service, 'execute').callsFake(() => {
			return new Promise((resolve, reject) => {
				const error = new Error('Test-message: status down')
				reject(error)
			})
		});

		const response = await request(server)
			.get(`/api/${process.env.RESTAPI_VERSION}/healthz`)

		expect(response.statusCode).to.eq(SERVER_ERROR)
		expect(response.body.status).to.be.eq('ko')
		expect(response.body.message).to.be.eq('Test-message: status down')
		expect(response.body.code).to.eq(SERVER_ERROR)
		expect(Boolean(response.body.stack)).to.be.true
	})
})
