import {MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey } from "typeorm";

export class OfferEntity1657188089075 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.createTable(new Table({
        name: "offer_entity",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true
          },
          {
            name: 'offerWallet',
            type: 'text',
          },
          {
            name: 'price',
            type: 'number',
          },
          {
            name: 'transactionId',
            type: 'text',
          },
          {
            name: 'listingId',
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

      await queryRunner.createForeignKey("offer_entity", new TableForeignKey({
        columnNames: ["listingId"],
        referencedColumnNames: ["id"],
        referencedTableName: "list_entity",
        onDelete: "CASCADE"
      }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.dropTable("offer_entity");
    }

}
