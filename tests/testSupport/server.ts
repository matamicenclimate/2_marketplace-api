process.env.NODE_ENV = 'testing'
process.env.RESTAPI_PORT = '4000'
import { Server } from 'node:http'
import { loadEnvVars } from '../../src/infrastructure/environment'
loadEnvVars()
let server: Server

import Main from '../../src/Main'
if (!server) {
  const { app } = Main.setup()
  server = app.listen() 
}
export default server