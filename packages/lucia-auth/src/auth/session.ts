import type { Session, Auth, User, UserSchema, SessionSchema } from "../types.js";
import { generateRandomString, LuciaError } from "../index.js";

type GetSession = (sessionId: string) => Promise<Session>;

export const getSessionFunction = (auth: Auth) => {
	const getSession: GetSession = async (sessionId) => {
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
	return getSession;
};

type GetSessionUser = (sessionId: string) => Promise<{
	user: User;
	session: Session;
}>;

export const getSessionUserFunction = (auth: Auth) => {
	const getSessionUser: GetSessionUser = async (sessionId) => {
		let userSessionData: {
			user: UserSchema;
			session: SessionSchema;
		} | null;
		if (auth.configs.adapter.getSessionAndUserBySessionId !== undefined) {
			userSessionData = await auth.configs.adapter.getSessionAndUserBySessionId(sessionId);
		} else {
			const sessionData = await auth.configs.adapter.getSession(sessionId);
			if (!sessionData) throw new LuciaError("AUTH_INVALID_SESSION_ID");
			const userData = await auth.configs.adapter.getUser(sessionData.user_id);
			if (!userData) throw new LuciaError("AUTH_INVALID_SESSION_ID");
			userSessionData = {
				user: userData,
				session: sessionData
			};
		}
		if (!userSessionData) throw new LuciaError("AUTH_INVALID_SESSION_ID");
		const { user: databaseUser, session: databaseSession } = userSessionData;
		if (new Date().getTime() > databaseSession.expires)
			throw new LuciaError("AUTH_INVALID_SESSION_ID");
		const user = auth.configs.transformUserData(databaseUser);
		return {
			user,
			session: {
				sessionId: databaseSession.id,
				expires: databaseSession.expires,
				userId: databaseSession.user_id,
				idlePeriodExpires: databaseSession.idle_expires
			}
		};
	};
	return getSessionUser;
};

type ValidateSession = (sessionId: string, setSessionCookie: SetSessionCookie) => Promise<Session>;
type SetSessionCookie = (session: Session | null) => void;

export const validateSessionFunction = (auth: Auth) => {
	const validateSession: ValidateSession = async (sessionId, setSessionCookie) => {
		if (sessionId.length !== 40) throw new LuciaError("AUTH_INVALID_SESSION_ID");
		try {
			const session = await auth.getSession(sessionId);
			setSessionCookie(session);
			return session;
		} catch (e) {
			if (!(e instanceof LuciaError)) throw e;
			if (e.message !== "AUTH_INVALID_SESSION_ID") throw e;
			return auth.renewSession(sessionId, setSessionCookie);
		}
	};
	return validateSession;
};

type ValidateSessionUser = (
	sessionId: string,
	setSessionCookie: SetSessionCookie
) => Promise<{ user: User; session: Session }>;

export const validateSessionUserFunction = (auth: Auth) => {
	const validateSessionUser: ValidateSessionUser = async (sessionId, setSessionCookie) => {
		if (sessionId.length !== 40) throw new LuciaError("AUTH_INVALID_SESSION_ID");
		try {
			const { session, user } = await auth.getSessionUser(sessionId);
			setSessionCookie(session);
			return { session, user };
		} catch (e) {
			if (!(e instanceof LuciaError)) throw e;
			if (e.message !== "AUTH_INVALID_SESSION_ID") throw e;
			const session = await auth.renewSession(sessionId, setSessionCookie);
			const user = await auth.getUser(session.userId);
			return {
				session,
				user
			};
		}
	};
	return validateSessionUser;
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

type RenewSession = (sessionId: string, setSessionCookie: SetSessionCookie) => Promise<Session>;

export const renewSessionFunction = (auth: Auth) => {
	const renewSession: RenewSession = async (sessionId, setSessionCookie) => {
		try {
			if (sessionId.length !== 40) throw new LuciaError("AUTH_INVALID_SESSION_ID");
			const databaseSession = await auth.configs.adapter.getSession(sessionId);
			if (!databaseSession) throw new LuciaError("AUTH_INVALID_SESSION_ID");
			if (new Date().getTime() > databaseSession.idle_expires) {
				await auth.configs.adapter.deleteSession(sessionId);
				throw new LuciaError("AUTH_INVALID_SESSION_ID");
			}
			await auth.configs.adapter.deleteSession(sessionId);
			const session = await auth.createSession(databaseSession.user_id);
			await auth.deleteDeadUserSessions(session.userId);
			setSessionCookie(session);
			return session;
		} catch (e) {
			if (e instanceof LuciaError && e.message === "AUTH_INVALID_SESSION_ID") {
				setSessionCookie(null);
			}
			throw e;
		}
	};
	return renewSession;
};
