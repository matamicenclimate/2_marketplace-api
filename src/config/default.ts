import { loadEnvVars } from '../infrastructure/environment'
loadEnvVars()

export default (() => {
	return {
		'environment': process.env.NODE_ENV,
		'port': process.env.RESTAPI_PORT,
		'version': process.env.RESTAPI_VERSION,
		'nft': {
			'storage': {
				'token': process.env.NFT_STORAGE_TOKEN
			}
		}
	}
})()