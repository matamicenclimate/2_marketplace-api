import config from "../config/default";
import DbConnectionService from "../services/DbConnectionService";
import { DataSource } from "typeorm";
import { ListEntity1656408785977 } from '../migration/1656408785977-ListEntity'
import { OfferEntity1657188089075 } from '../migration/1657188089075-OfferEntity'
import { AddPriceToListing1657188232338 } from '../migration/1657188232338-AddPriceToListing'
import AssetEntity from "../domain/model/AssetEntity";
import ListEntity from "../domain/model/ListEntity";
import AuctionEntity from "../domain/model/AuctionEntity";
import OfferEntity from "../domain/model/OfferEntity";
export const datasource = new DataSource({
  type: 'sqlite',
  database: `./databases/${config.environment}_${config.dbName}`,
  synchronize: false,
  entities: [AssetEntity, ListEntity, AuctionEntity, OfferEntity],
  migrations: [ListEntity1656408785977, OfferEntity1657188089075, AddPriceToListing1657188232338],
})

export default (async function () {
  if (process.argv.find((_) => _ === '--migrate')) {
    try {
      console.log('Starting migrations')
      await DbConnectionService.create()
      await datasource.runMigrations()
    } catch (error) {
      console.log('Migrations error' +  error.message)
    }
    console.log('Finished migrations')
  }
})()