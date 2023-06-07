import type { SessionSchema } from "lucia";
import type { PrismaSession } from "./prisma.js";

export const transformDatabaseSession = (
	sessionData: PrismaSession
): SessionSchema => {
	const { active_expires, idle_expires: idleExpires, ...data } = sessionData;
	return {
		...data,
		active_expires: Number(active_expires),
		idle_expires: Number(idleExpires)
	};
};
