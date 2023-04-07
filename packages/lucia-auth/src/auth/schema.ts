export type KeySchema = Readonly<{
	id: string;
	hashed_password: string | null;
	primary_key: boolean;
	user_id: string;
	expires: number | null;
}>;

export type UserSchema = Readonly<
	{
		id: string;
	} & Required<Lucia.UserAttributes>
>;

export type SessionSchema = Readonly<{
	id: string;
	active_expires: number | bigint;
	idle_expires: number | bigint;
	user_id: string;
}>;
