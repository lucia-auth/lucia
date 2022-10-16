import type { Session } from "../types.js";
import type { Context } from "./index.js";
import { generateRandomString, LuciaError } from "../index.js";
import { Cookies } from "../kit.js";

type ValidateSession = (sessionId: string) => Promise<Session>;

export const validateSessionFunction = (context: Context) => {
    const validateSession: ValidateSession = async (sessionId) => {
        const databaseSession = await context.adapter.getSession(sessionId);
        if (!databaseSession) throw new LuciaError("AUTH_INVALID_SESSION_ID");
        const currentTime = new Date().getTime();
        if (currentTime > databaseSession.expires)
            throw new LuciaError("AUTH_INVALID_SESSION_ID");
        const { user_id: userId, expires } = databaseSession;
        return {
            userId,
            expires,
            sessionId,
        };
    };
    return validateSession;
};

type GenerateSessionId = () => [string, number, number];

export const generateSessionIdFunction = (context: Context) => {
    const generateSessionId: GenerateSessionId = () => {
        const sessionId = generateRandomString(40);
        const sessionExpires = new Date().getTime() + context.sessionTimeout;
        const renewalPeriodExpires =
            sessionExpires + context.renewalPeriod;
        return [sessionId, sessionExpires, renewalPeriodExpires];
    };
    return generateSessionId;
};

type CreateSession = (userId: string) => Promise<{
    session: Session;
    setSessionCookie: (cookies: Cookies) => void;
    renewalPeriodExpires: number;
}>;

export const createSessionFunction = (context: Context) => {
    const createSession: CreateSession = async (userId) => {
        const [sessionId, sessionExpires, renewalPeriodExpires] =
            context.auth.generateSessionId();
        await context.adapter.setSession(sessionId, {
            userId,
            expires: sessionExpires,
            renewalPeriodExpires,
        });
        return {
            session: {
                userId,
                expires: sessionExpires,
                sessionId,
            },
            renewalPeriodExpires,
            setSessionCookie: (cookies) => {
                cookies.set("auth_session", sessionId, {
                    httpOnly: true,
                    expires: new Date(renewalPeriodExpires),
                    secure: context.env === "PROD",
                    path: "/",
                    sameSite: "lax",
                });
            },
        };
    };
    return createSession;
};

type InvalidateSession = (sessionId: string) => Promise<void>;

export const invalidateSessionFunction = (context: Context) => {
    const invalidateSession: InvalidateSession = async (sessionId) => {
        await context.adapter.deleteSession(sessionId);
    };
    return invalidateSession;
};

type InvalidateAllUserSessions = (userId: string) => Promise<void>;

export const invalidateUserSessionsFunction = (context: Context) => {
    const invalidateUserSessions: InvalidateAllUserSessions = async (
        userId: string
    ) => {
        await context.adapter.deleteSessionsByUserId(userId);
    };
    return invalidateUserSessions;
};

type DeleteDeadUserSessions = (userId: string) => Promise<void>;

export const deleteDeadUserSessionsFunction = (context: Context) => {
    const deleteDeadUserSessions: DeleteDeadUserSessions = async (userId) => {
        const sessions = await context.adapter.getSessionsByUserId(userId);
        const currentTime = new Date().getTime();
        const renewalExpiredSessionIds = sessions
            .filter((val) => val.renew_expires < currentTime)
            .map((val) => val.id);
        if (renewalExpiredSessionIds.length === 0) return;
        await context.adapter.deleteSession(...renewalExpiredSessionIds);
    };
    return deleteDeadUserSessions;
};

type RenewSession = (sessionId: string) => Promise<{
    session: Session;
    setSessionCookie: (cookies: Cookies) => void;
    renewalPeriodExpires: number;
}>;

export const renewSessionFunction = (context: Context) => {
    const renewSession: RenewSession = async (sessionId) => {
        const databaseSession = await context.adapter.getSession(sessionId);
        if (!databaseSession) throw new LuciaError("AUTH_INVALID_SESSION_ID");
        if (new Date().getTime() > databaseSession.renew_expires ) {
            await context.adapter.deleteSession(sessionId);
            throw new LuciaError("AUTH_INVALID_SESSION_ID");
        }
        await context.adapter.deleteSession(sessionId);
        return await context.auth.createSession(databaseSession.user_id);
    };
    return renewSession;
};
