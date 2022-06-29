import { IsOptional } from 'class-validator'
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm'

@Entity()
export default class AssetEntity{
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({
    type: 'blob',
    transformer: {
      from(input: object) {
        return JSON.stringify(input)
      },
      to(output: string) {
        console.log('.....output', typeof output)
        return output
      }
    }
  })
  arc69: object

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