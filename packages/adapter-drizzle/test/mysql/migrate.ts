import type { Pool } from "mysql2/promise";

// drizzle orm migrate doesnt work AGAIN :)
export async function migrate(client: Pool) {
    await client.execute("DROP TABLE IF EXISTS `auth_key`;");
    await client.execute("DROP TABLE IF EXISTS `auth_session`;");
    await client.execute("DROP TABLE IF EXISTS `auth_user`;");
	await client.execute(
		"CREATE TABLE IF NOT EXISTS `auth_key` (\n" +
			"\t`id` VARCHAR(255) PRIMARY KEY NOT NULL,\n" +
			"\t`user_id` VARCHAR(15) NOT NULL,\n" +
			"\t`primary_key` boolean NOT NULL,\n" +
			"\t`hashed_password` text,\n" +
			"\t`expires` bigint\n" +
			");\n"
	);
	await client.execute(
		"CREATE TABLE IF NOT EXISTS `auth_session` (\n" +
			"\t`id` VARCHAR(127) PRIMARY KEY NOT NULL,\n" +
			"\t`user_id` VARCHAR(15) NOT NULL,\n" +
			"\t`active_expires` bigint NOT NULL,\n" +
			"\t`idle_expires` bigint NOT NULL\n" +
			");\n"
	);
	await client.execute(
		"CREATE TABLE IF NOT EXISTS `auth_user` (\n" +
			"\t`id` VARCHAR(15) PRIMARY KEY NOT NULL,\n" +
			"\t`username` text NOT NULL\n" +
			");\n"
	);
	await client.execute(
		"ALTER TABLE `auth_key` ADD CONSTRAINT `auth_key_user_id_auth_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `auth_user`(`id`);"
	);
	await client.execute(
		"ALTER TABLE `auth_session` ADD CONSTRAINT `auth_session_user_id_auth_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `auth_user`(`id`);"
	);
}
