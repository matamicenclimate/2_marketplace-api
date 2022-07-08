import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn, DeleteDateColumn, OneToOne, JoinColumn, OneToMany, ManyToOne } from 'typeorm'
import ListEntity from './ListEntity'
@Entity()
export default class OfferEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  offerWallet: string

  @Column()
  price: number

  @Column()
  listingId: string

  @Column()
  transactionId: string

  @ManyToOne(() => ListEntity, list => list.offers)
  listing?: ListEntity;

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @DeleteDateColumn({ nullable: true, default: null })
  deletedAt?: Date | null;
}