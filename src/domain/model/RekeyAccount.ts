import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm'

@Entity()
export default class RekeyAccountRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  wallet: string

  @Column()
  assetId: number

  @Column()
  applicationId: number

  @Column()
  isClosedAuction: boolean

  @Column()
  auctionStartDate: string

  @Column()
  auctionEndDate: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @DeleteDateColumn()
  deletedAt?: Date;
}