import './InjectContainers'
import Application from 'koa'
import Entry from 'ts-entry-point'
import { useKoaServer } from 'routing-controllers'
import { handleErrors } from './middlewares/handleErrors'
import config from './config/default'
import { cors } from './middlewares/cors'
import { ui, validate } from 'swagger2-koa'
import * as swagger from 'swagger2'

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
    const swaggerDocument: any = swagger.loadDocumentSync('./src/public/api.yaml');
    const app = new Application()
    app.use(handleErrors)
    app.use(cors)
    app.use(ui(swaggerDocument, '/api/v1/docs'))
    // app.use(validate(swaggerDocument))

console.log("API started");
    useKoaServer(app, {
      cors: true,
      defaultErrorHandler: false,
      controllers: [`${__dirname}/controllers/*.ts`],
    })
    return { app }
  }
}
