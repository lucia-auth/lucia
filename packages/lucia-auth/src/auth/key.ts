import { Key, KeySchema } from "../types.js";

export const transformDatabaseKeyData = (
	databaseKey: KeySchema
): Key | null => {
	const currentTime = new Date().getTime();
	// invalid session
	if (databaseKey.expires !== null && currentTime > databaseKey.expires)
		return null;
	const [providerId, ...providerUserIdSegments] = databaseKey.id.split(":");
	const oneTimeExpires =
		databaseKey.expires === null ? null : new Date(databaseKey.expires);
	return {
		providerId,
		providerUserId: providerUserIdSegments.join(":"),
		isPrimary: databaseKey.primary,
		isPasswordDefined: !!databaseKey.hashed_password,
		userId: databaseKey.user_id,
		oneTimeExpires
	};
};

export const getOneTimeKeyExpiration = (
	duration: number | null | undefined
): null | Date => {
	if (typeof duration !== "number") return null;
	return new Date(duration * 1000 + new Date().getTime());
};
