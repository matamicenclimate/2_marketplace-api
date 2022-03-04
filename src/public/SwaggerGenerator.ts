import { getMetadataArgsStorage } from 'routing-controllers'
import { routingControllersToSpec } from 'routing-controllers-openapi'

const storage = getMetadataArgsStorage()
const spec = routingControllersToSpec(storage)
console.log(spec)