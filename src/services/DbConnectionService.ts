import { DataSource } from 'typeorm'
import { datasource } from '../data-source/Datasource'
let db: DataSource | null = null

export default class DbConnectionService {
  static async create() {
    if (db) return db
    const connection = await datasource.initialize()
    db = connection
    return db
  }
}