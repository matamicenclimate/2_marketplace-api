import { IsOptional } from 'class-validator'
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm'
import { Arc69 } from '../../../climate-nft-common/src/lib/AssetNote';

@Entity()
export default class AssetEntity{
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({
    type: 'text',
    transformer: {
      to(input: Arc69) {
        console.log('******************')
        console.log('input')
        console.log(input)
        console.log('')
        return JSON.stringify(input)
      },
      from(output: string) {
        console.log('.....output', typeof JSON.parse(output))
        return JSON.parse(output)
      }
    }
  })
  arc69: Arc69

  @Column()
  assetIdBlockchain: number

  @Column()
  causeId: string

  @Column()
  applicationIdBlockchain: number

  @Column()
  imageUrl: string

  @Column()
  ipnft: string

  @Column()
  url: string

  @Column()
  title: string

  @Column()
  creator: string
  
  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @DeleteDateColumn({ nullable: true, default: null })
  deletedAt?: Date | null;
}