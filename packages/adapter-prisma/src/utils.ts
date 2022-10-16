import { Session } from "@prisma/client";
import { SessionSchema } from "lucia-sveltekit/adapter";

export const convertSession = (session: Session): SessionSchema => {
    const { expires, idle_expires: idleExpires, ...data } = session
    return {
        expires: Number(expires),
        idle_expires: Number(idleExpires),
        ...data
    }
}