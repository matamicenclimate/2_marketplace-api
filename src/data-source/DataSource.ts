import { DataSource } from 'typeorm'
import config from '../config/default'

export const Datasource = new DataSource({
  type: 'sqlite',
  database: `./databases/${config.environment}-${config.dbName}`,
  entities: ['./src/domain/model/*.{ts,js}'],
  migrations: ['./src/migration/*.{ts,js}'],
  synchronize: false, 
  logging: false,
})