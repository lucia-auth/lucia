import type { User } from "../types.js";
import type { Context } from "./index.js";
import type { ServerLoad, ServerLoadEvent } from "../kit.js";

type HandleServerSession = <LoadFn extends ServerLoad = () => Promise<{}>>(
    serverLoad?: LoadFn
) => (
    event: ServerLoadEvent
) => Promise<Exclude<Awaited<ReturnType<LoadFn>>, void> & { _lucia: User }>;

export const handleServerSessionFunction = (context: Context) => {
    const handleServerSessionCore = async ({
        cookies,
    }: ServerLoadEvent): Promise<{ _lucia: User | null }> => {
        const sessionId = cookies.get("auth_session") || "";
        if (!sessionId) return { _lucia: null };
        try {
            const { user } = await context.auth.getSessionUser(sessionId); // throws an error is invalid
            console.log(user);
            return {
                _lucia: user,
            };
        } catch {}
        try {
            const { session, setSessionCookie } =
                await context.auth.renewSession(sessionId);
            const [user] = await Promise.all([
                context.auth.getUser(session.userId),
                context.auth.deleteDeadUserSessions(session.userId),
            ]);
            setSessionCookie(cookies);
            return {
                _lucia: user,
            };
        } catch (e) {
            context.auth.deleteAllCookies(cookies);
            return {
                _lucia: null,
            };
        }
    };
    const handleServerSession: HandleServerSession = (fn?) => {
        return async (event: ServerLoadEvent) => {
            const { _lucia } = await handleServerSessionCore(event);
            const loadFunction = fn || (async () => {});
            const result = (await loadFunction(event)) || {};
            return {
                _lucia,
                ...result,
            } as Exclude<Awaited<ReturnType<typeof loadFunction>>, void> & {
                _lucia: User;
            };
        };
    };
    return handleServerSession;
};
