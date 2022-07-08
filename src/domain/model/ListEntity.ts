import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn, DeleteDateColumn, OneToOne, JoinColumn, OneToMany, ManyToOne } from 'typeorm'
import { Listing } from '@common/lib/api/entities'
import AssetEntity from './AssetEntity';
import AuctionEntity from './AuctionEntity';
import OfferEntity from './OfferEntity';
@Entity()
export default class ListEntity implements Listing {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  marketplaceWallet: string

  @Column()
  assetIdBlockchain: number

  @Column()
  price: number

  @OneToOne(() => AssetEntity)
  @JoinColumn()
  asset: AssetEntity

  @Column()
  assetId: string

  @Column()
  type: 'direct-listing' | 'auction'

  @Column({ nullable: true, default: null })
  auctionId?: string

  @OneToOne(() => AuctionEntity)
  @JoinColumn()
  auction?: AuctionEntity

  @OneToMany(() => OfferEntity, offer => offer.listing)
  @JoinColumn({ name: 'listingId' })
  offers?: OfferEntity[];

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