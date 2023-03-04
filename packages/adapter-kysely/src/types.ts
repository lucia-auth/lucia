import type { ColumnType, Generated } from "kysely";

type BigIntColumnType = ColumnType<bigint | number>;

export type KyselySession = {
	active_expires: BigIntColumnType;
	id: string;
	idle_expires: BigIntColumnType;
	user_id: string;
};

export type KyselyUser = {
	id: Generated<string>;
};

export type KyselyKey = {
	id: string;
	hashed_password: string | null;
	user_id: string;
	primary: boolean | number;
	expires: BigIntColumnType | null;
};

export interface KyselyLuciaDatabase {
	session: KyselySession;
	user: KyselyUser;
	key: KyselyKey;
}
