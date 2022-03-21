// import { loadEnvVars } from '../infrastructure/environment'
// loadEnvVars()
require('dotenv').config()

function die(what: Error | string): never {
  if (typeof what === 'string') {
    throw new Error(what)
  }
  throw what
}

const config = {
  environment:
    process.env.NODE_ENV ??
    die(`Environment variable "NODE_ENV" wasn't defined!`),
  port:
    process.env.RESTAPI_PORT ??
    die(`Environment variable "RESTAPI_PORT" wasn't defined!`),
  version:
    process.env.RESTAPI_VERSION ??
    die(`Environment variable "RESTAPI_VERSION" wasn't defined!`),
  nft: {
    storage: {
      token:
        process.env.NFT_STORAGE_TOKEN ??
        die(`Environment variable "NFT_STORAGE_TOKEN" wasn't defined!`),
    },
  },
  algoClientApiKey:
    process.env.ALGO_CLIENT_X_API_KEY ??
    die(`Environment variable "ALGO_CLIENT_X_API_KEY" wasn't defined!`),
  defaultWallet: {
    nemonic:
      process.env.WALLET_NEMONIC ??
      die(`Environment variable "WALLET_NEMONIC" wasn't defined!`),
    address:
      process.env.WALLET_ADDRESS ??
      die(`Environment variable "WALLET_ID" wasn't defined!`),
  },
}
export default config
