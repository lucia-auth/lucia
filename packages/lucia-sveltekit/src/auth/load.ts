import { createBlankCookies, setCookie } from "../utils/cookie.js";
import type { Session } from "../types.js";
import type { Context } from "./index.js";
import type { ServerLoad, ServerLoadEvent } from "../kit.js";
import { LuciaError } from "../utils/error.js";
type HandleServerSession = <LoadFn extends ServerLoad = () => Promise<{}>>(
    serverLoad?: LoadFn
) => (
    event: ServerLoadEvent
) => Promise<Exclude<Awaited<ReturnType<LoadFn>>, void> & { _lucia: Session }>;

export const handleServerSessionFunction = (context: Context) => {
    const handleServerSessionCore = async ({
        cookies,
    }: ServerLoadEvent): Promise<{ _lucia: Session | null }> => {
        const accessToken = cookies.get("access_token");
        const refreshToken = cookies.get("refresh_token");
        if (!accessToken && !refreshToken) return { _lucia: null };
        try {
            if (!accessToken) throw new LuciaError("AUTH_INVALID_ACCESS_TOKEN");
            const session = await context.auth.validateAccessToken(accessToken); // throws an error is invalid
            return {
                _lucia: session,
            };
        } catch {}
        try {
            if (!refreshToken)
                throw new LuciaError("AUTH_INVALID_REFRESH_TOKEN");
            const session = await context.auth.refreshTokens(refreshToken);
            const [, accessTokenCookie] = session.accessToken;
            const [, refreshTokenCookie] = session.refreshToken;
            setCookie(cookies, accessTokenCookie, refreshTokenCookie);
            return {
                _lucia: {
                    expires: session.expires,
                    user: session.user,
                },
            };
        } catch {
            const blankCookies = createBlankCookies();
            setCookie(cookies, ...blankCookies);
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
                _lucia: Session;
            };
        };
    };
    return handleServerSession;
};
