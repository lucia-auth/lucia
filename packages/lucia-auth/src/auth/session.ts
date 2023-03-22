import { isWithinExpiration } from "../utils/date.js";
import { Session } from "./index.js";
import { SessionSchema } from "./schema.type.js";

export const validateDatabaseSessionData = (
	databaseSession: SessionSchema
): Session | null => {
	if (
		databaseSession.idle_expires !== null &&
		!isWithinExpiration(databaseSession.idle_expires)
	) {
		return null;
	}
	const isActive = isWithinExpiration(databaseSession.active_expires);
	return {
		sessionId: databaseSession.id,
		userId: databaseSession.user_id,
		activePeriodExpires: new Date(Number(databaseSession.active_expires)),
		idlePeriodExpires: new Date(Number(databaseSession.idle_expires)),
		state: isActive ? "active" : "idle",
		isFresh: false
	};
};
