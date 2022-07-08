import './InjectContainers'
import Application from 'koa'
import Entry from 'ts-entry-point'
import { useKoaServer } from 'routing-controllers'
import { handleErrors } from './middlewares/handleErrors'
import config from './config/default'
import { cors } from './middlewares/cors'
import { ui } from 'swagger2-koa'
import * as swagger from 'swagger2'
import CustomLogger from './infrastructure/CustomLogger'
import HealthzController from './controllers/HealthzController'
import IpfsController from './controllers/IpfsController'
import ListingsController from './controllers/ListingsController'
import ApplicationsController from './controllers/ApplicationsController'
import MintController from './controllers/MintController'
import CloseAuction from './services/CloseAuction'
import FindByQueryService from './services/list/FindByQueryService'
import Container from 'typedi'
import OfferController from './controllers/OfferController'

@Entry
export default class Main {
  static async main(args: string[]) {
    const { app } = await this.setup()
    const server = app.listen(this.port, this.done)
    const HUNDRED_SECONDS = 100000
    server.setTimeout(HUNDRED_SECONDS)
    return app
  }

  static readonly port = config.port

  private static done() {
    const logger = new CustomLogger()
    logger.info(`Listening on port ${Main.port}!`)
  }

  static setup() {
    const swaggerDocument: any = swagger.loadDocumentSync(
      './src/public/api.yaml'
    )
    const app = new Application()
    app.use(require('koa-morgan')('combined'))
    app.use(handleErrors)
    app.use(cors)
    app.use(ui(swaggerDocument, '/api/v1/docs'))

    useKoaServer(app, {
      cors: true,
      defaultErrorHandler: false,
      controllers: [
        HealthzController,
        IpfsController,
        ListingsController,
        MintController,
        ApplicationsController,
        OfferController
      ],
    })

    const logger = new CustomLogger()
    setInterval(async () => {
      try {
        const findByQueryService = Container.get(FindByQueryService)
        const closeAuction = Container.get(CloseAuction)
        logger.info('close auctions')
        const nfts = await findByQueryService.execute({
          isClosed: false
        })
        logger.info(`Close auctions detect ${nfts.length} nfts`)
        await closeAuction.execute(nfts)
      } catch (error) {
        logger.error('Error in app interval closing auctions: ' + error.message, { stack: error.stack, errors: error.errors })
      }
    }, parseInt(config.closeAuctionIntervalMiliseconds))
    return { app }
  }
}
