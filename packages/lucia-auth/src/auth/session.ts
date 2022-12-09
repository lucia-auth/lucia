import { Session, SessionSchema } from "../types.js";

export const getSessionFromDatabaseData = (databaseSession: SessionSchema): Session | null => {
	const currentTime = new Date().getTime();
	// invalid session
	if (currentTime > databaseSession.idle_expires) return null;
	return {
		sessionId: databaseSession.id,
		userId: databaseSession.user_id,
		activePeriodExpires: new Date(databaseSession.expires),
		idlePeriodExpires: new Date(databaseSession.idle_expires),
		state: currentTime > databaseSession.expires ? "idle" : "active",
		isFresh: false
	};
};
