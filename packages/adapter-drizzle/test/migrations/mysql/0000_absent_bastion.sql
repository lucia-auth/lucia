CREATE TABLE `auth_key` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`primary_key` boolean NOT NULL,
	`hashed_password` text,
	`expires` bigint
);

CREATE TABLE `auth_session` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`active_expires` bigint NOT NULL,
	`idle_expires` bigint NOT NULL
);

CREATE TABLE `auth_user` (
	`id` text PRIMARY KEY NOT NULL
);

ALTER TABLE `auth_key` ADD CONSTRAINT `auth_key_user_id_auth_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `auth_user`(`id`);
ALTER TABLE `auth_session` ADD CONSTRAINT `auth_session_user_id_auth_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `auth_user`(`id`);