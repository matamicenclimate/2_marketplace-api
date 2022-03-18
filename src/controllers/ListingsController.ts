import { Get, JsonController, Param, Post } from 'routing-controllers'
import { Inject, Service } from 'typedi'
import OptInService from '@common/services/OptInService'
import config from '../config/default'
import { OpenAPI } from 'routing-controllers-openapi'

// ONLY DEV - Prints swagger json
// import { getMetadataArgsStorage } from 'routing-controllers'
// import { routingControllersToSpec } from 'routing-controllers-openapi'
// import util from 'util'

@Service()
@JsonController('/api')
export default class ListingsController {
  @Inject()
  readonly optInService: OptInService

  @OpenAPI({
    description:
      'Creates a new assets (opts-in the asset) in the marketplace account.',
    responses: {
      200: 'The asset was opted in successfully, returns information about the transaction.',
      500: 'Unexpected internal error, contact support.',
      400: 'Missing (Or wrong/ill formatted) asset ID parameter.',
    },
  })
  @Post(`/${config.version}/opt-in/:id`)
  async optIn(@Param('id') id: number) {
    return await this.optInService.optInAssetByID(id)
  }

  @Get('/v1/nfts')
  async invoke() {
    return [
      {
        image: 'bafybeihj6jett6klfymvf5t6zezl3br4dhpg2rowcyiib4brcaxcmidgd4',
        title: 'Test',
        description: 'Some description',
        artist: 'Some random user',
        transaction: 'ULT4WDKDAEIPXDCUMQVHGJRT7XEBB7M7SEMXQQLN43R66L76XV5Q',
      },
      {
        image: 'bafybeihj6jett6klfymvf5t6zezl3br4dhpg2rowcyiib4brcaxcmidgd4',
        title: 'Test 2',
        description: 'Some description 2',
        artist: 'Some random user',
        transaction: 'ULT4WDKDAEIPXDCUMQVHGJRT7XEBB7M7SEMXQQLN43R66L76XV5Q',
      },
      {
        image: 'bafybeihj6jett6klfymvf5t6zezl3br4dhpg2rowcyiib4brcaxcmidgd4',
        title: 'Test 3',
        description: 'Some description 3',
        artist: 'Some random user',
        transaction: 'ULT4WDKDAEIPXDCUMQVHGJRT7XEBB7M7SEMXQQLN43R66L76XV5Q',
      },
      {
        image: 'bafybeihj6jett6klfymvf5t6zezl3br4dhpg2rowcyiib4brcaxcmidgd4',
        title: 'Test No Desc',
        description: '',
        artist: 'Some random user',
        transaction: 'ULT4WDKDAEIPXDCUMQVHGJRT7XEBB7M7SEMXQQLN43R66L76XV5Q',
      },
      {
        image: 'bafybeihj6jett6klfymvf5t6zezl3br4dhpg2rowcyiib4brcaxcmidgd4',
        title: 'Hello',
        description: 'World',
        artist: 'Some random user',
        transaction: 'ULT4WDKDAEIPXDCUMQVHGJRT7XEBB7M7SEMXQQLN43R66L76XV5Q',
      },
    ]
  }
}

// ONLY DEV - Prints swagger json
// const storage = getMetadataArgsStorage()
// const spec = routingControllersToSpec(storage)
// console.log(util.inspect(spec, false, null, true /* enable colors */))
