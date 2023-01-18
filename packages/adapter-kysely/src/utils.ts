import type { SessionSchema } from "lucia-auth";
import type { Selectable } from "kysely";
import type { KyselySession } from "./types.js";

export const convertSession = (
	session: Selectable<KyselySession>
): SessionSchema => {
	const { expires, idle_expires: idleExpires, ...data } = session;
	return {
		expires: Number(expires),
		idle_expires: Number(idleExpires),
		...data
	};
};
