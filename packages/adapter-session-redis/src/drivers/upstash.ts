import type { Redis } from "@upstash/redis";
import type { InitializeAdapter, SessionAdapter, SessionSchema } from "lucia";

export const DEFAULT_SESSION_PREFIX = "session";
export const DEFAULT_USER_SESSIONS_PREFIX = "user_sessions";

export const upstashSessionAdapter = (
	upstashClient: Redis,
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
				const sessionData = await upstashClient.get(sessionKey(sessionId));
				if (!sessionData) return null;
				return sessionData as SessionSchema;
			},
			getSessionsByUserId: async (userId) => {
				const sessionIds = await upstashClient.smembers(
					userSessionsKey(userId)
				);
				if (sessionIds.length === 0) return [];
				const pipeline = upstashClient.pipeline();
				for (const sessionId of sessionIds) {
					pipeline.get(sessionKey(sessionId));
				}
				const maybeSessions = await pipeline.exec<
					Array<SessionSchema | null>
				>();
				return maybeSessions.filter(
					(maybeSession): maybeSession is NonNullable<typeof maybeSession> => {
						return maybeSession !== null;
					}
				);
			},
			setSession: async (session) => {
				const pipeline = upstashClient.pipeline();
				pipeline.sadd(userSessionsKey(session.user_id), session.id);
				pipeline.set(sessionKey(session.id), JSON.stringify(session), {
					ex: Math.floor(Number(session.idle_expires) / 1000)
				});
				await pipeline.exec();
			},
			deleteSession: async (sessionId) => {
				const session = await upstashClient.get<SessionSchema>(
					sessionKey(sessionId)
				);
				if (!session) return;
				const pipeline = upstashClient.pipeline();
				pipeline.del(sessionKey(sessionId));
				pipeline.srem(userSessionsKey(session.user_id), sessionId);
				await pipeline.exec();
			},
			deleteSessionsByUserId: async (userId) => {
				const sessionIds = await upstashClient.smembers(
					userSessionsKey(userId)
				);
				const pipeline = upstashClient.pipeline();
				for (const sessionId of sessionIds) {
					pipeline.del(sessionKey(sessionId));
				}
				pipeline.del(userSessionsKey(userId));
				await pipeline.exec();
			},
			updateSession: async (sessionId, partialSession) => {
				const session = await upstashClient.get<SessionSchema>(
					sessionKey(sessionId)
				);
				if (!session) return;
				const updatedSession = { ...session, ...partialSession };
				await upstashClient.set(
					sessionKey(sessionId),
					JSON.stringify(updatedSession),
					{
						ex: Math.floor(Number(updatedSession.idle_expires) / 1000)
					}
				);
			}
		};
	};
};
