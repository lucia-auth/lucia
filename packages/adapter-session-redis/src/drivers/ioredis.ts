import type { InitializeAdapter, SessionAdapter, SessionSchema } from "lucia";
import type { Redis } from "ioredis";

export const DEFAULT_SESSION_PREFIX = "session";
export const DEFAULT_USER_SESSIONS_PREFIX = "user_sessions";

export const ioredisSessionAdapter = (
	client: Redis,
	prefixes?: {
		session: string;
		userSessions: string;
	}
): InitializeAdapter<SessionAdapter> => {
	return () => {
		const sessionKey = (sessionId: string) => {
			return [prefixes?.session ?? DEFAULT_SESSION_PREFIX, sessionId].join(":");
		};
		const userSessionsKey = (userId: string) => {
			return [
				prefixes?.userSessions ?? DEFAULT_USER_SESSIONS_PREFIX,
				userId
			].join(":");
		};

		return {
			getSession: async (sessionId) => {
				const sessionData = await client.get(sessionKey(sessionId));
				if (!sessionData) return null;
				const session = JSON.parse(sessionData) as SessionSchema;
				return session;
			},
			getSessionsByUserId: async (userId) => {
				const sessionIds = await client.smembers(userSessionsKey(userId));
				const sessionData = await Promise.all(
					sessionIds.map((sessionId) => client.get(sessionKey(sessionId)))
				);
				const sessions = sessionData
					.filter((val): val is string => val !== null)
					.map((val) => JSON.parse(val) as SessionSchema);
				return sessions;
			},
			setSession: async (session) => {
				await Promise.all([
					client.sadd(userSessionsKey(session.user_id), session.id),
					client.set(
						sessionKey(session.id),
						JSON.stringify(session),
						"EX",
						Math.floor(Number(session.idle_expires) / 1000)
					)
				]);
			},
			deleteSession: async (sessionId) => {
				const sessionData = await client.get(sessionKey(sessionId));
				if (!sessionData) return;
				const session = JSON.parse(sessionData) as SessionSchema;
				await Promise.all([
					client.del(sessionKey(sessionId)),
					client.srem(userSessionsKey(session.user_id), sessionId)
				]);
			},
			deleteSessionsByUserId: async (userId) => {
				const sessionIds = await client.smembers(userSessionsKey(userId));
				await Promise.all([
					...sessionIds.map((sessionId) => client.del(sessionKey(sessionId))),
					client.del(userSessionsKey(userId))
				]);
			},
			updateSession: async (sessionId, partialSession) => {
				const sessionData = await client.get(sessionKey(sessionId));
				if (!sessionData) return;
				const session = JSON.parse(sessionData) as SessionSchema;
				const updatedSession = {
					...session,
					...partialSession
				};
				await client.set(
					sessionKey(sessionId),
					JSON.stringify(updatedSession),
					"EX",
					Math.floor(Number(updatedSession.idle_expires) / 1000)
				);
			}
		};
	};
};
