import { Inject, Service } from 'typedi'
const axios = require('axios').default
import config from '../config/default'
import algosdk from 'algosdk'
import CustomLogger from '../infrastructure/CustomLogger'
import { Asset, AssetNormalized, PopulatedAsset, Transaction } from 'src/interfaces'
import { none, some, option } from '@octantis/option'
import { AxiosResponse } from 'axios'

@Service()
export default class ListingService {
  @Inject()
  private readonly logger!: CustomLogger
  async listing() {
    const assets = await this.getAssets()
    const assetsPopulated = await this.getPopulatedAssets(assets)
    const assetsNormalized = this.getNormalizedAssets(assetsPopulated)

    return assetsNormalized
  }

  async getPopulatedAssets(assets: Asset[]) {
    let counter = 0
    let promises = []
    const assetsPopulated: PopulatedAsset[] = []
    if (!Array.isArray(assets)) return assetsPopulated
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

  getNormalizedAssets(assetsPopulated: PopulatedAsset[]) {
    const assetsNormalized = []
    for (const asset of assetsPopulated) {
      const assetNormalized: option<AssetNormalized> = this.normalizeAsset(asset)
      if (assetNormalized.isDefined()) {
        assetsNormalized.push(assetNormalized.value)
      }
    }

    return assetsNormalized
  }

  async getAssets() {
    try {
      const { address } = config.defaultWallet
      const response: AxiosResponse = await axios.get(
        `${config.algoIndexerApi}/accounts/${address}`,
        {
          headers: {
            accept: 'application/json',
            'x-api-key': config.algoClientApiKey,
          },
        }
      )
      return response.data.account.assets
    } catch (error) {
      if (error.response.status === 404) return []
      throw error
    }
  }

  async populateAsset(asset: number) {
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

  normalizeAsset(asset: PopulatedAsset): option<AssetNormalized> {
    const txn = asset.transactions.find((x: Transaction) => x.note != null)
    if (txn && txn.note) {
      try {
        const metadata: AssetNormalized = algosdk.decodeObj(Buffer.from(txn.note, 'base64')) as AssetNormalized
        return some(metadata)
      } catch (error) {
        this.logger.error(error.message)
      }
    }

    return none()
  }
}
