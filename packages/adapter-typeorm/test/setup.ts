import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1693226517817 implements MigrationInterface {
	name = "Migrations1693226517817";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "user" ("id" text NOT NULL, "username" character varying(256) NOT NULL, CONSTRAINT "UQ_78a916df40e02a9deb1c4b75edb" UNIQUE ("username"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`
		);
		await queryRunner.query(
			`CREATE TABLE "session" ("id" text NOT NULL, "user_id" text NOT NULL, "active_expires" bigint NOT NULL, "idle_expires" bigint NOT NULL, "country" character varying(256) NOT NULL, CONSTRAINT "PK_f55da76ac1c3ac420f444d2ff11" PRIMARY KEY ("id"))`
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_30e98e8746699fb9af235410af" ON "session" ("user_id") `
		);
		await queryRunner.query(
			`CREATE TABLE "key" ("id" text NOT NULL, "user_id" text NOT NULL, "hashed_password" text, CONSTRAINT "PK_5bd67cf28791e02bf07b0367ace" PRIMARY KEY ("id"))`
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_ce3251bd4e97eda3b0a4a9d7dd" ON "key" ("user_id") `
		);
		await queryRunner.query(
			`ALTER TABLE "session" ADD CONSTRAINT "FK_30e98e8746699fb9af235410aff" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
		);
		await queryRunner.query(
			`ALTER TABLE "key" ADD CONSTRAINT "FK_ce3251bd4e97eda3b0a4a9d7ddd" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "key" DROP CONSTRAINT "FK_ce3251bd4e97eda3b0a4a9d7ddd"`
		);
		await queryRunner.query(
			`ALTER TABLE "session" DROP CONSTRAINT "FK_30e98e8746699fb9af235410aff"`
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_ce3251bd4e97eda3b0a4a9d7dd"`
		);
		await queryRunner.query(`DROP TABLE "key"`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_30e98e8746699fb9af235410af"`
		);
		await queryRunner.query(`DROP TABLE "session"`);
		await queryRunner.query(`DROP TABLE "user"`);
	}
}
