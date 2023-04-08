import type { KeySchema } from "./schema.js";
import type { Key } from "./index.js";
import { isWithinExpiration } from "../utils/date.js";

export const transformDatabaseKey = (databaseKey: KeySchema): Key => {
	const [providerId, ...providerUserIdSegments] = databaseKey.id.split(":");
	const isPersistent = databaseKey.expires === null;
	const providerUserId = providerUserIdSegments.join(":");
	const userId = databaseKey.user_id;
	const isPasswordDefined = !!databaseKey.hashed_password;
	if (isPersistent) {
		return {
			type: "persistent",
			primary: databaseKey.primary_key,
			providerId,
			providerUserId,
			userId,
			passwordDefined: isPasswordDefined
		};
	}
	return {
		type: "single_use",
		providerId,
		providerUserId,
		userId,
		expiresAt: new Date(databaseKey.expires),
		expired: !isWithinExpiration(databaseKey.expires),
		passwordDefined: isPasswordDefined
	};
};

export const getOneTimeKeyExpiration = (
	duration: number | null | undefined
): null | Date => {
	if (typeof duration !== "number") return null;
	return new Date(duration * 1000 + new Date().getTime());
};
