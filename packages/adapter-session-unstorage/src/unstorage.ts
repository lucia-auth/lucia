import type { SessionSchema, SessionAdapter, InitializeAdapter } from "lucia";
import { type Storage } from "unstorage";

export const DEFAULT_SESSION_PREFIX = "session";
export const DEFAULT_USER_SESSIONS_PREFIX = "user_sessions";

export const unstorageAdapter = (
	client: Storage,
	prefixes?: {
		session: string;
		userSessions: string;
	}
): InitializeAdapter<SessionAdapter> => {
	return () => {
		const { session: sessionKeyPrefix, userSessions: userSessionKeyPrefix } =
			prefixes ?? {
				session: DEFAULT_SESSION_PREFIX,
				userSessions: DEFAULT_USER_SESSIONS_PREFIX
			};
		return {
			getSession: async (sessionId) => {
				const sessionData = await client.getItem(
					`${sessionKeyPrefix}:${sessionId}`
				);
				return sessionData as SessionSchema | null;
			},
			getSessionsByUserId: async (userId) => {
				const userKeys = await client.getKeys(
					`${userSessionKeyPrefix}:${userId}`
				);
				const sessionIds = await Promise.all(
					userKeys.map((id) => client.getItem(id) as Promise<string>)
				);
				return Promise.all(
					sessionIds.map(
						(id) =>
							client.getItem(
								`${sessionKeyPrefix}:${id}`
							) as Promise<SessionSchema>
					)
				);
			},
			setSession: async (session) => {
				await Promise.all([
					client.setItem(
						`${userSessionKeyPrefix}:${session.user_id}:${
							session.id
						}${Date.now()}`,
						session.id
					),
					client.setItem(
						`${sessionKeyPrefix}:${session.id}`,
						session,
						session.idle_expires
					) //@todo Implement key expiration https://github.com/unjs/unstorage/pull/236
				]);
			},
			deleteSession: async (sessionId) => {
				const sessionData = (await client.getItem(
					`${sessionKeyPrefix}:${sessionId}`
				)) as SessionSchema | null;
				if (!sessionData) return;
				await Promise.all([
					client.removeItem(`${sessionKeyPrefix}:${sessionId}`),
					client.clear(
						`${userSessionKeyPrefix}:${sessionData.user_id}:${sessionId}`
					)
				]);
			},
			deleteSessionsByUserId: async (userId) => {
				const userKeys = await client.getKeys(
					`${userSessionKeyPrefix}:${userId}`
				);
				const sessionIds = await Promise.all(
					userKeys.map((id) => client.getItem(id) as Promise<string>)
				);
				await Promise.all([
					...sessionIds.map((id) =>
						client.removeItem(`${sessionKeyPrefix}:${id}`)
					),
					client.clear(`${userSessionKeyPrefix}:${userId}`)
				]);
			},
			updateSession: async (sessionId, partialSession) => {
				const sessionData = (await client.getItem(
					`${sessionKeyPrefix}:${sessionId}`
				)) as SessionSchema | null;
				if (!sessionData) return;
				const updatedSession = { ...sessionData, ...partialSession };
				client.setItem(
					`${sessionKeyPrefix}:${updatedSession.id}`,
					updatedSession,
					updatedSession.idle_expires
				); //@todo Implement key expiration https://github.com/unjs/unstorage/pull/236
			}
		};
	};
};
