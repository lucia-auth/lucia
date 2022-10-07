import { setCookie } from "../utils/cookie.js";
import type { User } from "../types.js";
import type { Context } from "./index.js";
import type { ServerLoad, ServerLoadEvent } from "../kit.js";
import { LuciaError } from "../utils/error.js";
type HandleServerSession = <LoadFn extends ServerLoad = () => Promise<{}>>(
    serverLoad?: LoadFn
) => (
    event: ServerLoadEvent
) => Promise<Exclude<Awaited<ReturnType<LoadFn>>, void> & { _lucia: User }>;

export const handleServerSessionFunction = (context: Context) => {
    const handleServerSessionCore = async ({
        cookies,
    }: ServerLoadEvent): Promise<{ _lucia: User | null }> => {
        const accessToken = cookies.get("access_token");
        const refreshToken = cookies.get("refresh_token");
        if (!accessToken && !refreshToken) return { _lucia: null };
        try {
            if (!accessToken) throw new LuciaError("AUTH_INVALID_ACCESS_TOKEN");
            const user = await context.auth.getSessionUser(accessToken); // throws an error is invalid
            return {
                _lucia: user,
            };
        } catch {}
        try {
            if (!refreshToken)
                throw new LuciaError("AUTH_INVALID_REFRESH_TOKEN");
            const { session, tokens } = await context.auth.refreshTokens(
                refreshToken
            );
            const [accessToken, accessTokenCookie] = tokens.accessToken;
            const [_, refreshTokenCookie] = tokens.refreshToken;
            const [user] = await Promise.all([
                context.auth.getSessionUser(accessToken),
                context.auth.deleteExpiredUserSessions(session.userId),
            ]);
            setCookie(cookies, accessTokenCookie, refreshTokenCookie);
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
