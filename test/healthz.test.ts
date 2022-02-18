process.env.NODE_ENV = 'testing'
process.env.RESTAPI_PORT = '4000'
import { loadEnvVars } from '../src/infrastructure/environment'
loadEnvVars()

import request from 'supertest'
import Main from '../src/Main'
import HealthzService from '../src/services/HealthzService'
import Container from 'typedi'

const { app } = Main.setup()
const SUCCESS = 200
const SERVER_ERROR = 500
const server = app.listen()

describe('api', () => {
	test('Server is available', async () => {
		const response = await request(server).get(`/api/${process.env.RESTAPI_VERSION}/healthz`)

		expect(response.statusCode).toBe(SUCCESS)
		expect(response.body.status).toBe('ok')
	})
	test('Server is not available', async () => {
		const service = Container.get(HealthzService)
		jest.spyOn(service, 'execute').mockImplementation(() => {
			return new Promise((resolve, reject) => {
				const error = new Error('Test-message: status down')
				reject(error)
			})
		})

		const response = await request(server).get(`/api/${process.env.RESTAPI_VERSION}/healthz`)

		expect(response.statusCode).toBe(SERVER_ERROR)
		expect(response.body.status).toBe('ko')
		expect(response.body.message).toBe('Test-message: status down')
		expect(response.body.code).toBe(SERVER_ERROR)
		expect(response.body.stack).toBeTruthy()
	})
})
