import { loadEnvVars } from '../infrastructure/environment'
loadEnvVars()

export default (() => {
	return {
		'environment': process.env.NODE_ENV,
		'port': process.env.RESTAPI_PORT,
		'version': process.env.RESTAPI_VERSION,
	}
})()