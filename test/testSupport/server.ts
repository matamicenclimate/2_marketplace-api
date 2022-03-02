process.env.NODE_ENV = 'testing'
process.env.RESTAPI_PORT = '4000'
import { loadEnvVars } from '../../src/infrastructure/environment'
loadEnvVars()
let server

import Main from '../../src/Main'
if (!server) {
  const { app } = Main.setup()
  server = app.listen((err) => {
    if (err) console.log(err.message)
  })
}
export default server