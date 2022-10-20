import type { Session } from "../types.js";
import type { Context } from "./index.js";
import { generateRandomString, LuciaError } from "../index.js";

type ValidateSession = (sessionId: string) => Promise<Session>;

export const validateSessionFunction = (context: Context) => {
    const validateSession: ValidateSession = async (sessionId) => {
        if (sessionId.length !== 40)
            throw new LuciaError("AUTH_INVALID_SESSION_ID");
        const databaseSession = await context.adapter.getSession(sessionId);
        if (!databaseSession) throw new LuciaError("AUTH_INVALID_SESSION_ID");
        const currentTime = new Date().getTime();
        if (currentTime > databaseSession.expires)
            throw new LuciaError("AUTH_INVALID_SESSION_ID");
        const {
            user_id: userId,
            expires,
            idle_expires: idlePeriodExpires,
        } = databaseSession;
        return {
            userId,
            expires,
            sessionId,
            idlePeriodExpires,
        };
    };
    return validateSession;
};

type GenerateSessionId = () => [string, number, number];

export const generateSessionIdFunction = (context: Context) => {
    const generateSessionId: GenerateSessionId = () => {
        const sessionId = generateRandomString(40);
        const sessionExpires = new Date().getTime() + context.sessionTimeout;
        const renewalPeriodExpires = sessionExpires + context.idlePeriodTimeout;
        return [sessionId, sessionExpires, renewalPeriodExpires];
    };
    return generateSessionId;
};

type CreateSession = (userId: string) => Promise<Session>;

export const createSessionFunction = (context: Context) => {
    const createSession: CreateSession = async (userId) => {
        const [sessionId, sessionExpires, idlePeriodExpires] =
            context.auth.generateSessionId();
        await context.adapter.setSession(sessionId, {
            userId,
            expires: sessionExpires,
            idlePeriodExpires,
        });
        return {
            userId,
            expires: sessionExpires,
            sessionId,
            idlePeriodExpires,
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

export const invalidateAllUserSessionsFunction = (context: Context) => {
    const invalidateAllUserSessions: InvalidateAllUserSessions = async (
        userId: string
    ) => {
        await context.adapter.deleteSessionsByUserId(userId);
    };
    return invalidateAllUserSessions;
};

type DeleteDeadUserSessions = (userId: string) => Promise<void>;

export const deleteDeadUserSessionsFunction = (context: Context) => {
    const deleteDeadUserSessions: DeleteDeadUserSessions = async (userId) => {
        const sessions = await context.adapter.getSessionsByUserId(userId);
        const currentTime = new Date().getTime();
        const deadSessionIds = sessions
            .filter((val) => val.idle_expires < currentTime)
            .map((val) => val.id);
        if (deadSessionIds.length === 0) return;
        await context.adapter.deleteSession(...deadSessionIds);
    };
    return deleteDeadUserSessions;
};

type RenewSession = (sessionId: string) => Promise<Session>;

export const renewSessionFunction = (context: Context) => {
    const renewSession: RenewSession = async (sessionId) => {
        if (sessionId.length !== 40)
            throw new LuciaError("AUTH_INVALID_SESSION_ID");
        const databaseSession = await context.adapter.getSession(sessionId);
        if (!databaseSession) throw new LuciaError("AUTH_INVALID_SESSION_ID");
        if (new Date().getTime() > databaseSession.idle_expires) {
            await context.adapter.deleteSession(sessionId);
            throw new LuciaError("AUTH_INVALID_SESSION_ID");
        }
        await context.adapter.deleteSession(sessionId);
        return await context.auth.createSession(databaseSession.user_id);
    };
    return renewSession;
};
