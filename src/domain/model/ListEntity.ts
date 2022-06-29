import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm'
import { Listing } from '@common/lib/api/entities'
@Entity()
// ListEntity
export default class ListEntity implements Listing {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  marketplaceWallet: string

  @Column()
  assetIdBlockchain: number

  @Column()
  assetId: string

  @Column({ nullable: true, default: null })
  auctionId?: string

  @Column()
  applicationIdBlockchain: number

  @Column()
  isClosed: boolean

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @DeleteDateColumn({ nullable: true, default: null })
  deletedAt?: Date | null;
}