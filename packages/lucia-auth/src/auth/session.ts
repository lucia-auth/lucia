import { isWithinExpiration } from "../utils/date.js";
import { Session } from "./index.js";
import { SessionSchema } from "./schema.js";

export const validateDatabaseSession = (
	databaseSession: SessionSchema
): Session | null => {
	if (!isWithinExpiration(databaseSession.idle_expires)) {
		return null;
	}
	const activeKey = isWithinExpiration(databaseSession.active_expires);
	return {
		sessionId: databaseSession.id,
		userId: databaseSession.user_id,
		activePeriodExpiresAt: new Date(Number(databaseSession.active_expires)),
		idlePeriodExpiresAt: new Date(Number(databaseSession.idle_expires)),
		state: activeKey ? "active" : "idle",
		fresh: false
	};
};
