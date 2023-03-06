import { Key, KeySchema } from "../types.js";
import { LuciaError } from "./error.js";

export const validateDatabaseKey = (databaseKey: KeySchema): Key => {
	const currentTime = new Date().getTime();
	// invalid session
	if (databaseKey.expires !== null && currentTime > databaseKey.expires) {
		throw new LuciaError("AUTH_EXPIRED_KEY");
	}
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
