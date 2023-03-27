import type { ColumnType, Generated } from "kysely";

type BigIntColumnType = ColumnType<bigint | number>;

export type KyselySession = {
	active_expires: BigIntColumnType;
	id: string;
	idle_expires: BigIntColumnType;
	user_id: string;
};

export type KyselyUser<UserAttributes extends {} = {}> = {
	id: Generated<string>;
} & UserAttributes;

export type KyselyKey = {
	id: string;
	hashed_password: string | null;
	user_id: string;
	primary_key: boolean | number;
	expires: BigIntColumnType | null;
};

export interface KyselyLuciaDatabase<UserAttributes extends {} = {}> {
	auth_session: KyselySession;
	auth_user: KyselyUser<UserAttributes>;
	auth_key: KyselyKey;
}
