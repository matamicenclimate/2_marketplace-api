import { Inject, Service } from 'typedi'
const axios = require('axios').default
import config from '../config/default'
import algosdk from 'algosdk'
import CustomLogger from '../infrastructure/CustomLogger'

@Service()
export default class ListingService {
  @Inject()
  private readonly logger!: CustomLogger
  async listing() {
    const assets = await this.getAssets()
    const assetsPopulated = await this.getPopulatedAssets(assets)
    const assetsNormalized = this.getNormalizedAssets(assetsPopulated)
    const asset = await this.populateAsset(80741879)
    console.log(this.normalizeAsset(asset))
    return assetsNormalized
  }

  async getPopulatedAssets(assets: any) {
    let counter = 0
    let promises = []
    const assetsPopulated = []
    while (counter < assets.length) {
      promises.push(this.populateAsset(assets[counter]['asset-id']))
      if (counter === assets.length - 1 || promises.length > 9) {
        const result = await Promise.all(promises)
        assetsPopulated.push(...result)
        promises = []
      }

      counter++
    }

    return assetsPopulated
  }

  getNormalizedAssets(assetsPopulated: any) {
    const assetsNormalized = []
    for (const asset of assetsPopulated) {
      const assetNormalized = this.normalizeAsset(asset)
      if (assetNormalized) {
        assetsNormalized.push(assetNormalized)
      }
    }

    return assetsNormalized
  }

  async getAssets() {
    const { address } = config.defaultWallet
    const response = await axios.get(
      `${config.algoIndexerApi}/accounts/${address}`,
      {
        headers: {
          accept: 'application/json',
          'x-api-key': config.algoClientApiKey,
        },
      }
    )

    return response.data.account.assets
  }

  async populateAsset(asset: number) {
    const { address } = config.defaultWallet
    const response = await axios.get(
      `${config.algoIndexerApi}/assets/${asset}/transactions`,
      {
        headers: {
          accept: 'application/json',
          'x-api-key': config.algoClientApiKey,
        },
      }
    )

    return response.data
  }

  normalizeAsset(asset: any) {
    const txn = asset.transactions.find((x: any) => x.note != null)
    if (txn) {
      try {
        const metadata: any = algosdk.decodeObj(Buffer.from(txn.note, 'base64'))
        return metadata
      } catch (error) {
        this.logger.error(error.message)
      }
    }

    return null
  }
}
