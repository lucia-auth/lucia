import type { Session, Auth } from "../types.js";
import { generateRandomString, LuciaError } from "../index.js";

type ValidateSession = (sessionId: string) => Promise<Session>;

export const validateSessionFunction = (auth: Auth) => {
	const validateSession: ValidateSession = async (sessionId) => {
		if (sessionId.length !== 40) throw new LuciaError("AUTH_INVALID_SESSION_ID");
		const databaseSession = await auth.configs.adapter.getSession(sessionId);
		if (!databaseSession) throw new LuciaError("AUTH_INVALID_SESSION_ID");
		const currentTime = new Date().getTime();
		if (currentTime > databaseSession.expires) throw new LuciaError("AUTH_INVALID_SESSION_ID");
		const { user_id: userId, expires, idle_expires: idlePeriodExpires } = databaseSession;
		return {
			userId,
			expires,
			sessionId,
			idlePeriodExpires
		};
	};
	return validateSession;
};

type GenerateSessionId = () => [string, number, number];

export const generateSessionIdFunction = (auth: Auth) => {
	const generateSessionId: GenerateSessionId = () => {
		const sessionId = generateRandomString(40);
		const sessionExpires = new Date().getTime() + auth.configs.sessionTimeout;
		const renewalPeriodExpires = sessionExpires + auth.configs.idlePeriodTimeout;
		return [sessionId, sessionExpires, renewalPeriodExpires];
	};
	return generateSessionId;
};

type CreateSession = (userId: string) => Promise<Session>;

export const createSessionFunction = (auth: Auth) => {
	const createSession: CreateSession = async (userId) => {
		const [sessionId, sessionExpires, idlePeriodExpires] = auth.generateSessionId();
		await auth.configs.adapter.setSession(sessionId, {
			userId,
			expires: sessionExpires,
			idlePeriodExpires
		});
		return {
			userId,
			expires: sessionExpires,
			sessionId,
			idlePeriodExpires
		};
	};
	return createSession;
};

type InvalidateSession = (sessionId: string) => Promise<void>;

export const invalidateSessionFunction = (auth: Auth) => {
	const invalidateSession: InvalidateSession = async (sessionId) => {
		await auth.configs.adapter.deleteSession(sessionId);
	};
	return invalidateSession;
};

type InvalidateAllUserSessions = (userId: string) => Promise<void>;

export const invalidateAllUserSessionsFunction = (auth: Auth) => {
	const invalidateAllUserSessions: InvalidateAllUserSessions = async (userId: string) => {
		await auth.configs.adapter.deleteSessionsByUserId(userId);
	};
	return invalidateAllUserSessions;
};

type DeleteDeadUserSessions = (userId: string) => Promise<void>;

export const deleteDeadUserSessionsFunction = (auth: Auth) => {
	const deleteDeadUserSessions: DeleteDeadUserSessions = async (userId) => {
		const sessions = await auth.configs.adapter.getSessionsByUserId(userId);
		const currentTime = new Date().getTime();
		const deadSessionIds = sessions
			.filter((val) => val.idle_expires < currentTime)
			.map((val) => val.id);
		if (deadSessionIds.length === 0) return;
		await auth.configs.adapter.deleteSession(...deadSessionIds);
	};
	return deleteDeadUserSessions;
};

type RenewSession = (sessionId: string) => Promise<Session>;

export const renewSessionFunction = (auth: Auth) => {
	const renewSession: RenewSession = async (sessionId) => {
		if (sessionId.length !== 40) throw new LuciaError("AUTH_INVALID_SESSION_ID");
		const databaseSession = await auth.configs.adapter.getSession(sessionId);
		if (!databaseSession) throw new LuciaError("AUTH_INVALID_SESSION_ID");
		if (new Date().getTime() > databaseSession.idle_expires) {
			await auth.configs.adapter.deleteSession(sessionId);
			throw new LuciaError("AUTH_INVALID_SESSION_ID");
		}
		await auth.configs.adapter.deleteSession(sessionId);
		return await auth.createSession(databaseSession.user_id);
	};
	return renewSession;
};
