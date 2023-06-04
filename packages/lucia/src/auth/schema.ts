export type KeySchema = Readonly<{
	id: string;
	hashed_password: string | null;
	user_id: string;
}>;

export type UserSchema = Readonly<
	{
		id: string;
	} & Lucia.DatabaseUserAttributes
>;

export type SessionSchema = Readonly<
	{
		id: string;
		active_expires: number | bigint;
		idle_expires: number | bigint;
		user_id: string;
	} & Lucia.DatabaseSessionAttributes
>;
