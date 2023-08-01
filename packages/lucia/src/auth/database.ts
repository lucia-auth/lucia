export type KeySchema = {
	id: string;
	hashed_password: string | null;
	user_id: string;
};

export type UserSchema = {
	id: string;
} & Lucia.DatabaseUserAttributes;

export type SessionSchema = {
	id: string;
	active_expires: number;
	idle_expires: number;
	user_id: string;
} & Lucia.DatabaseSessionAttributes;

export const createKeyId = (providerId: string, providerUserId: string) => {
	if (providerId.includes(":")) {
		throw new TypeError("Provider id must not include any colons (:)");
	}
	return `${providerId}:${providerUserId}`;
};
