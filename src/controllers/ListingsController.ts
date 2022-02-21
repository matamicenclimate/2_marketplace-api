import { Get, JsonController } from 'routing-controllers'
import { Inject, Service } from 'typedi'

@Service()
@JsonController('/api')
export default class ListingsController {
  @Inject()
  @Get('/v1/nfts')
  async invoke() {
    return [
      {
        "image": "bafybeihj6jett6klfymvf5t6zezl3br4dhpg2rowcyiib4brcaxcmidgd4",
        "title": "Test",
        "description": "Some description",
        "artist": "Some random user",
        "transaction": "ULT4WDKDAEIPXDCUMQVHGJRT7XEBB7M7SEMXQQLN43R66L76XV5Q"
      },
      {
        "image": "bafybeihj6jett6klfymvf5t6zezl3br4dhpg2rowcyiib4brcaxcmidgd4",
        "title": "Test 2",
        "description": "Some description 2",
        "artist": "Some random user",
        "transaction": "ULT4WDKDAEIPXDCUMQVHGJRT7XEBB7M7SEMXQQLN43R66L76XV5Q"
      },
      {
        "image": "bafybeihj6jett6klfymvf5t6zezl3br4dhpg2rowcyiib4brcaxcmidgd4",
        "title": "Test 3",
        "description": "Some description 3",
        "artist": "Some random user",
        "transaction": "ULT4WDKDAEIPXDCUMQVHGJRT7XEBB7M7SEMXQQLN43R66L76XV5Q"
      },
      {
        "image": "bafybeihj6jett6klfymvf5t6zezl3br4dhpg2rowcyiib4brcaxcmidgd4",
        "title": "Test No Desc",
        "description": "",
        "artist": "Some random user",
        "transaction": "ULT4WDKDAEIPXDCUMQVHGJRT7XEBB7M7SEMXQQLN43R66L76XV5Q"
      },
      {
        "image": "bafybeihj6jett6klfymvf5t6zezl3br4dhpg2rowcyiib4brcaxcmidgd4",
        "title": "Hello",
        "description": "World",
        "artist": "Some random user",
        "transaction": "ULT4WDKDAEIPXDCUMQVHGJRT7XEBB7M7SEMXQQLN43R66L76XV5Q"
      }
    ]
  }
}