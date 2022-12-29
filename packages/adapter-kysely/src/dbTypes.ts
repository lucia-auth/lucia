import { ColumnType } from "kysely";

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
	? ColumnType<S, I | undefined, U>
	: ColumnType<T, T | undefined, T>;

export type UnixTimeColumnType = ColumnType<bigint | number>;

export interface Session {
	expires: UnixTimeColumnType;
	id: string;
	idle_expires: UnixTimeColumnType;
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
