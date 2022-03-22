import './InjectContainers'
import Application from 'koa'
import Entry from 'ts-entry-point'
import { useKoaServer } from 'routing-controllers'
import { handleErrors } from './middlewares/handleErrors'
import config from './config/default'
import { cors } from './middlewares/cors'
import { ui, validate } from 'swagger2-koa'
import * as swagger from 'swagger2'
import CustomLogger from './infrastructure/CustomLogger'
import HealthzController from './controllers/HealthzController'
import IpfsController from './controllers/IpfsController'
import ListingsController from './controllers/ListingsController'
import MintController from './controllers/MintController'

@Entry
export default class Main {
  static async main(args: string[]) {
    const { app } = await this.setup()
    app.listen(this.port, this.done)
    return app
  }

  static readonly port = config.port

  private static done() {
    const logger = new CustomLogger()
    logger.info(`Listening on port ${Main.port}!`)
  }

  static setup() {
    const swaggerDocument: any = swagger.loadDocumentSync('./src/public/api.yaml');
    const app = new Application()
    app.use(handleErrors)
    app.use(cors)
    app.use(ui(swaggerDocument, '/api/v1/docs'))
    // app.use(validate(swaggerDocument))

    useKoaServer(app, {
      cors: true,
      defaultErrorHandler: false,
      controllers: [
        HealthzController,
        IpfsController,
        ListingsController,
        MintController,
      ],
    })
    return { app }
  }
}
