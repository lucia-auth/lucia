import type { SessionSchema } from "lucia-auth";

// TODO: Remove bigint => number conversion on next major version
export const convertSession = (session: SessionSchema): SessionSchema => {
	const { active_expires, idle_expires: idleExpires, ...data } = session;
	return {
		active_expires: Number(active_expires),
		idle_expires: Number(idleExpires),
		...data
	};
};
