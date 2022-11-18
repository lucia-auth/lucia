import type { SessionSchema } from "lucia-auth/types";
import type { Selectable } from "kysely";
import type { Session } from "./dbTypes";

export const convertSession = (session: Selectable<Session>): SessionSchema => {
	const { expires, idle_expires: idleExpires, ...data } = session;
	return {
		expires: Number(expires),
		idle_expires: Number(idleExpires),
		...data
	};
};
