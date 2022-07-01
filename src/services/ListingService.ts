import { Inject, Service } from 'typedi'
import axios from 'axios'
import config from '../config/default'
import algosdk from 'algosdk'
import CustomLogger from '../infrastructure/CustomLogger'
import {
  Asset,
  AssetNormalized,
  AssetTransactionResponse,
  Transaction,
} from 'src/interfaces'
import { some, option, none } from '@octantis/option'
import { AxiosPromise, AxiosResponse } from 'axios'
import ServiceException from 'src/infrastructure/errors/ServiceException'
import { retrying } from '@common/lib/net'
import ListEntity from '../domain/model/ListEntity'
import ListRepostory from 'src/infrastructure/repositories/ListRepository'
import { DataSource } from 'typeorm'

@Service()
export default class ListingService {
  @Inject()
  private readonly logger!: CustomLogger

  /**
   * Generates assets by fetching them to the blockchain.
   * @returns An asynchronous generator that yields assets with all the data.
   */
  async *list() {
    this.logger.info('We are listing assets in marketplace')
    for await (const { ['asset-id']: id } of this.getAssetsLightData()) {
      const data = await this.populateAsset(id)
      yield this.normalizeAsset(data)
      this.logger.info(` Yielded asset #${id} (by listing).`)
    }
  }

  /** @deprecated */
  async listing() {
    this.logger.info('We are listing assets in marketplace')
    const assets = await this.getAssets()
    const assetsPopulated = await this.getPopulatedAssets(assets)
    this.logger.info(`Listed ${assetsPopulated.length} assets`)
    return this.getNormalizedAssets(assetsPopulated)
  }

  async getAsset(assetId: number) {
    const assetPopulated = await this.populateAsset(assetId)
    return this.normalizeAsset(assetPopulated)
  }

  async getAssetsFromWallet(
    wallet: string = config.defaultWallet.address,
    db: DataSource
  ) {
    const repo = db.getRepository(ListEntity)
    const query = new ListRepostory(repo)
    const response = await query.findByQuery({
      marketplaceWallet: wallet,
      isClosed: false,
    })

    return response
  }

  /** @deprecated */
  async getPopulatedAssets(assets: Asset[]) {
    const PROMISES_CHUNK_SIZE = 5
    let counter = 0
    let promises = []
    const assetsPopulated: AssetTransactionResponse[] = []
    if (!Array.isArray(assets)) return assetsPopulated
    while (counter < assets.length) {
      promises.push(this.populateAsset(assets[counter]['asset-id']))
      if (
        counter === assets.length - 1 ||
        promises.length > PROMISES_CHUNK_SIZE
      ) {
        const result = await Promise.all(promises)
        assetsPopulated.push(...result)
        promises = []
      }
      counter++
    }
    return assetsPopulated
  }

  getNormalizedAssets(assetsPopulated: AssetTransactionResponse[]) {
    const assetsNormalized = []
    for (const asset of assetsPopulated) {
      const assetNormalized: option<AssetNormalized> =
        this.normalizeAsset(asset)
      if (assetNormalized.isDefined()) {
        assetsNormalized.push(assetNormalized.value)
      }
    }

    return assetsNormalized
  }

  async *getAssetsLightData() {
    try {
      const { address } = config.defaultWallet
      const req = axios.get<{
        account: { assets: { ['asset-id']: number }[] }
      }>(`${config.algoIndexerApi}/accounts/${address}`, {
        headers: {
          accept: 'application/json',
          'x-api-key': config.algoClientApiKey,
        },
      })
      const response = await retrying(req)
      yield* response.data.account.assets
    } catch (error) {
      if (
        error.errors?.find((s: any) => s.response?.status === 404) ||
        error.response?.status === 404
      )
        return []
      throw new ServiceException(error.message, error.response?.status)
    }
  }

  /** @deprecated */
  async getAssets() {
    try {
      const { address } = config.defaultWallet
      const addressAssetsRequest = axios.get(
        `${config.algoIndexerApi}/accounts/${address}`,
        {
          headers: {
            accept: 'application/json',
            'x-api-key': config.algoClientApiKey,
          },
        }
      )
      const response = await this.retryAxiosRequest(
        addressAssetsRequest,
        5,
        1000
      )
      return response.data.account.assets
    } catch (error) {
      if (error.response.status === 404) return []
      throw new ServiceException(error.message, error.response.status)
    }
  }

  async populateAsset(id: number) {
    try {
      const req = axios.get<AssetTransactionResponse>(
        `${config.algoIndexerApi}/assets/${id}/transactions`,
        {
          headers: {
            accept: 'application/json',
            'x-api-key': config.algoClientApiKey,
          },
        }
      )
      const response = await retrying(req)
      return { ...response.data, id }
    } catch (error) {
      const message = 'Error on populate asset: ' + error.message
      this.logger.error(message, { stack: error.stack })
      throw new ServiceException(message, error.response.status)
    }
  }

  /** @deprecated */
  async retryAxiosRequest(
    promise: AxiosPromise,
    retryCount: number,
    timeout: number
  ): Promise<AxiosResponse> {
    try {
      return await new Promise(async (resolve, reject) => {
        setTimeout(async () => {
          reject('Timeout is reached!')
        }, timeout) // Se va a disparar siempre
        try {
          resolve(await promise)
        } catch (e) {
          reject(e)
        }
      })
    } catch (err) {
      if (retryCount < 1) {
        throw err
      }
      return await this.retryAxiosRequest(promise, retryCount - 1, timeout)
    }
  }

  normalizeAsset(asset: AssetTransactionResponse): option<AssetNormalized> {
    const txn = [...asset.transactions]
      .reverse()
      .find((x: Transaction) => x.note != null)

    const creator = asset.transactions.find((i: Transaction) =>
      Boolean(i['asset-config-transaction']?.params?.creator)
    ) as Transaction

    if (txn && txn.note) {
      try {
        const metadata: AssetNormalized = algosdk.decodeObj(
          Buffer.from(txn.note, 'base64')
        ) as AssetNormalized
        const assetCreator =
          creator['asset-config-transaction']?.params?.creator
        metadata.creator = assetCreator ? assetCreator : metadata.creator

        return some({
          ...metadata,
          id: (asset as any).id,
          note: txn.note
        })
      } catch (error) {
        this.logger.error(error.message, { stack: error.stack })
      }
    }

    return none()
  }

  async getMyAssetsFromWallet(wallet: string = config.defaultWallet.address) {
    const response = await axios.get(
      `${config.algoIndexerApi}/accounts/${wallet}/assets`,
      {
        headers: {
          accept: 'application/json',
          'x-api-key': config.algoClientApiKey,
        },
      }
    )

    return { ...response.data }
  }
}
