import { isWithinExpiration } from "../utils/date.js";
import { Session, User } from "./index.js";
import { SessionSchema, UserSchema } from "./schema.js";

export const transformDatabaseSession = (
	databaseSession: SessionSchema,
	user: User
): Session => {
	const activeKey = isWithinExpiration(databaseSession.active_expires);
	return {
		user,
		sessionId: databaseSession.id,
		activePeriodExpiresAt: new Date(Number(databaseSession.active_expires)),
		idlePeriodExpiresAt: new Date(Number(databaseSession.idle_expires)),
		state: activeKey ? "active" : "idle",
		fresh: false
	};
};

export const isValidDatabaseSession = (databaseSession: SessionSchema) => {
	return isWithinExpiration(databaseSession.idle_expires);
};
