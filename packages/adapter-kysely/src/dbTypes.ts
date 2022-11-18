import { ColumnType } from "kysely";

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
	? ColumnType<S, I | undefined, U>
	: ColumnType<T, T | undefined, T>;

export type Int8 = ColumnType<string, string | number | bigint, string | number | bigint>;

export interface Session {
	expires: Int8;
	id: string;
	idle_expires: Int8;
	user_id: string;
}

export interface User {
	hashed_password: string | null;
	id: Generated<string>;
	provider_id: string;
}

export interface DB {
	session: Session;
	user: User;
}
