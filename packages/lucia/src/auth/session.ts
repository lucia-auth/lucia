import { isWithinExpiration } from "../utils/date.js";

import type { SessionSchema } from "./database.js";

export const isValidDatabaseSession = (databaseSession: SessionSchema): boolean => {
	return isWithinExpiration(databaseSession.idle_expires);
};
