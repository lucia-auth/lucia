import type { ColumnType, Generated } from "kysely";

type BigIntColumnType = ColumnType<bigint | number>;

export interface KyselySession {
	expires: BigIntColumnType;
	id: string;
	idle_expires: BigIntColumnType;
	user_id: string;
}

export interface KyselyUser {
	hashed_password: string | null;
	id: Generated<string>;
	provider_id: string;
}

export interface KyselyLuciaDatabase {
	session: KyselySession;
	user: KyselyUser;
}
