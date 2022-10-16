import { Session } from "@prisma/client";
import { SessionSchema } from "lucia-sveltekit/adapter";

export const convertSession = (session: Session): SessionSchema => {
    const { expires, renew_expires, ...data } = session
    return {
        expires: Number(expires),
        renew_expires: Number(renew_expires),
        ...data
    }
}