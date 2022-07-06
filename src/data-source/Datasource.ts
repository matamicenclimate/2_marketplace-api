import config from "../config/default";
import DbConnectionService from "../services/DbConnectionService";
import { DataSource } from "typeorm";
import { ListEntity1656408785977 } from '../migration/1656408785977-ListEntity'
import AssetEntity from "../domain/model/AssetEntity";
import ListEntity from "../domain/model/ListEntity";
import AuctionEntity from "../domain/model/AuctionEntity";
export const datasource = new DataSource({
  type: 'sqlite',
  database: `./databases/${config.environment}_${config.dbName}`,
  synchronize: false,
  entities: [AssetEntity, ListEntity, AuctionEntity],
  migrations: [ListEntity1656408785977],
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