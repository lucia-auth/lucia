import { Session } from "@prisma/client";
import type { SessionSchema } from "lucia-auth";

export const convertSession = (session: Session): SessionSchema => {
	const { expires, idle_expires: idleExpires, ...data } = session;
	return {
		expires: Number(expires),
		idle_expires: Number(idleExpires),
		...data
	};
};
