import type { SessionSchema } from "lucia-auth";

// TODO: Remove bigint => number conversion on next major version
export const convertSession = (session: SessionSchema): SessionSchema => {
	const { expires, idle_expires: idleExpires, ...data } = session;
	return {
		expires: Number(expires),
		idle_expires: Number(idleExpires),
		...data
	};
};
