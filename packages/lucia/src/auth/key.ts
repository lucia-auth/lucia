import type { KeySchema } from "./schema.js";
import type { Key } from "./index.js";

export const transformDatabaseKey = (databaseKey: KeySchema): Key => {
	const [providerId, ...providerUserIdSegments] = databaseKey.id.split(":");
	const providerUserId = providerUserIdSegments.join(":");
	const userId = databaseKey.user_id;
	const isPasswordDefined = !!databaseKey.hashed_password;
	return {
		providerId,
		providerUserId,
		userId,
		passwordDefined: isPasswordDefined
	};
};
