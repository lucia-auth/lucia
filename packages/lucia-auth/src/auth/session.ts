import { Session, SessionSchema } from "../types.js";

export const transformDatabaseSessionData = (
	databaseSession: SessionSchema
): Session | null => {
	const currentTime = new Date().getTime();
	// invalid session
	if (currentTime > databaseSession.idle_expires) return null;
	return {
		sessionId: databaseSession.id,
		userId: databaseSession.user_id,
		activePeriodExpires: new Date(Number(databaseSession.active_expires)),
		idlePeriodExpires: new Date(Number(databaseSession.idle_expires)),
		state: currentTime > databaseSession.active_expires ? "idle" : "active",
		isFresh: false
	};
};
