import './InjectContainers'
import Application from 'koa'
import Entry from 'ts-entry-point'
import { useKoaServer } from 'routing-controllers'

import { handleErrors } from './middlewares/handleErrors'
import config from './config/default'

@Entry
export default class Main {
  static async main(args: string[]) {
    const { app } = await this.setup()
    app.listen(this.port, this.done)
    return app
  }

  static readonly port = config.port

  private static done() {
    console.log(`Listening on port ${Main.port}!`)
    console.log(`Go and test the API!`)
  }
  
  static setup() {
    const app = new Application()
    app.use(handleErrors)
    useKoaServer(app, {
      defaultErrorHandler: false,
      controllers: [`${__dirname}/controllers/*.ts`],
    })
    return { app }
  }
}
