import { MigrationInterface, QueryRunner, TableColumn } from "typeorm"

export class AddPriceToListing1657188232338 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.addColumn("list_entity", new TableColumn({
          name: "price",
          type: "int"
      }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.dropColumn("list_entity", 'price')
    }

}
