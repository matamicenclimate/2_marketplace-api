import { Service } from 'typedi'
import { Column, DataSource, Entity, PrimaryColumn, Repository } from 'typeorm'

@Entity()
export class RekeyAccountRecord {
  @PrimaryColumn()
  readonly address: string

  @Column()
  readonly nemonic: string
}

@Service()
export default class RekeyService {
  static async create() {
    const db = await new DataSource({
      type: 'sqlite',
      database: 'accounts.db',
      synchronize: true,
      entities: [RekeyAccountRecord],
    }).initialize()
    const repo = db.getRepository(RekeyAccountRecord)
    return new RekeyService(repo)
  }
  constructor(private repo: Repository<RekeyAccountRecord>) {}

  /**
   * Saves one rekey account.
   */
  async insert(entity: RekeyAccountRecord) {
    return await this.repo.save(entity)
  }

  /**
   * Fetches all rekey accounts.
   */
  async getAll() {
    return await this.repo.find()
  }
}
