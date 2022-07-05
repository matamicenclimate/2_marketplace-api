import {MigrationInterface, QueryRunner, Table, TableIndex, TableColumn, TableForeignKey } from "typeorm";

export class ListEntity1656408785977 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: "auction_entity",
            columns: [
                {
                    name: "id",
                    type: "uuid",
                    isPrimary: true
                },
                {
                  name: 'startDate',
                  type: 'datetime',
                },
                {
                  name: 'endDate',
                  type: 'datetime',
                },
                {
                  name: 'createdAt',
                  type: 'datetime',
                  default: 'now()'
                },
                {
                  name: 'updatedAt',
                  type: 'datetime',
                  default: 'now()'
                },
                {
                  name: 'deletedAt',
                  type: 'datetime',
                  default: null,
                  isNullable: true
                }
            ]
        }), true)

        await queryRunner.createTable(new Table({
          name: "asset_entity",
          columns: [
            {
                name: "id",
                type: "uuid",
                isPrimary: true
            },
            {
              name: 'arc69',
              type: 'text',
            },
            {
              name: 'assetIdBlockchain',
              type: 'number',
            },
            {
              name: 'applicationIdBlockchain',
              type: 'number',
            },
            {
              name: 'causeId',
              type: 'text',
            },
            {
              name: 'note',
              type: 'text',
            },
            {
              name: 'imageUrl',
              type: 'text',
            },
            {
              name: 'ipnft',
              type: 'text',
            },
            {
              name: 'url',
              type: 'text',
            },
            {
              name: 'title',
              type: 'text',
            },
            {
              name: 'creator',
              type: 'text',
            },
            {
              name: 'createdAt',
              type: 'datetime',
              default: 'now()'
            },
            {
              name: 'updatedAt',
              type: 'datetime',
              default: 'now()'
            },
            {
              name: 'deletedAt',
              type: 'datetime',
              default: null,
              isNullable: true
            }
          ]
        }), true)

        await queryRunner.createTable(new Table({
          name: "list_entity",
          columns: [
            {
                name: "id",
                type: "uuid",
                isPrimary: true
            },
            {
              name: 'marketplaceWallet',
              type: 'text',
            },
            {
              name: 'assetIdBlockchain',
              type: 'number',
            },
            {
              name: 'applicationIdBlockchain',
              type: 'number',
            },
            {
              name: 'assetId',
              type: 'text',
            },
            {
              name: 'auctionId',
              type: 'text',
              default: null,
              isNullable: true
            },
            {
              name: 'type',
              type: 'text'
            },
            {
              name: 'isClosed',
              type: 'boolean',
            },
            {
              name: 'createdAt',
              type: 'datetime',
              default: 'now()'
            },
            {
              name: 'updatedAt',
              type: 'datetime',
              default: 'now()'
            },
            {
              name: 'deletedAt',
              type: 'datetime',
              default: null,
              isNullable: true
            }
          ]
      }), true)

        await queryRunner.createForeignKey("list_entity", new TableForeignKey({
            columnNames: ["auctionId"],
            referencedColumnNames: ["id"],
            referencedTableName: "auction_entity",
            onDelete: "CASCADE"
        }));
        await queryRunner.createForeignKey("list_entity", new TableForeignKey({
          columnNames: ["assetId"],
          referencedColumnNames: ["id"],
          referencedTableName: "asset_entity",
          onDelete: "CASCADE"
      }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.dropTable("auction_entity");
      await queryRunner.dropTable("asset_entity");
      await queryRunner.dropTable("list_entity");
    }
}
