import { isWithinExpiration } from "../utils/date.js";

import type { SessionSchema } from "./schema.js";

export const isValidDatabaseSession = (databaseSession: SessionSchema) => {
	return isWithinExpiration(databaseSession.idle_expires);
};
