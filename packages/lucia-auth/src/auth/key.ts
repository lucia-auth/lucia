import { Key, KeySchema } from "../types.js";

export const transformDatabaseKeyData = (databaseKey: KeySchema): Key => {
	const [providerId, ...providerUserIdSegments] = databaseKey.id.split(":");
	return {
		providerId,
		providerUserId: providerUserIdSegments.join(":"),
		isPrimary: databaseKey.primary,
		isPasswordDefined: !!databaseKey.hashed_password,
		userId: databaseKey.user_id
	};
};
