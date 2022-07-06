import config from "../config/default";
import DbConnectionService from "../services/DbConnectionService";
import { DataSource } from "typeorm";

export const datasource = new DataSource({
  type: 'sqlite',
  database: `./databases/${config.environment}_${config.dbName}`,
  synchronize: false,
  entities: [`./src/domain/model/*.{ts,js}`],
  migrations: [`./src/migration/*.{ts,js}`],
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