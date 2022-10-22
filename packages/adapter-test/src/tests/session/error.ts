import type { SessionAdapter } from "lucia-sveltekit/types";
import { test, end, validate } from "../../test.js";
import { User } from "../../db.js";
import { Database } from "../../index.js";

const INVALID_INPUT = "INVALID_INPUT";

export const testSessionAdapterErrors = async (
    adapter: SessionAdapter,
    db: Database,
    endProcess = true
) => {
    const clearAll = async () => {
        await db.clearSessions();
        await db.clearUsers();
    };
    await clearAll();
    await test(
        "setSession()",
        "Throw AUTH_INVALID_USER_ID if user id doesn't exist",
        async () => {
            const session = new User().createSession();
            try {
                await adapter.setSession(session.id, {
                    expires: session.expires,
                    userId: INVALID_INPUT,
                    idlePeriodExpires: session.idlePeriodExpires,
                });
                throw new Error("No error was thrown");
            } catch (e) {
                const error = e as Error;
                validate.isEqual(
                    error.message,
                    "AUTH_INVALID_USER_ID",
                    "Unexpected error message"
                );
            }
            await clearAll();
        }
    );
    await test(
        "setSession()",
        "Throw AUTH_DUPLICATE_SESSION_ID if session id is already in use",
        async () => {
            const user1 = new User();
            const user2 = new User();
            const user1Session = user1.createSession();
            const user2Session = user1.createSession();
            await db.insertUser(user1.getSchema());
            await db.insertUser(user2.getSchema());
            await db.insertSession(user1Session.getSchema());
            try {
                await adapter.setSession(user1Session.id, {
                    userId: user2Session.userId,
                    expires: user2Session.expires,
                    idlePeriodExpires: user2Session.idlePeriodExpires,
                });
                throw new Error("No error was thrown");
            } catch (e) {
                const error = e as Error;
                validate.isEqual(
                    error.message,
                    "AUTH_DUPLICATE_SESSION_ID",
                    "Unexpected error message"
                );
            }
            await clearAll();
        }
    );
    await clearAll();
    if (!endProcess) return;
    end();
};
