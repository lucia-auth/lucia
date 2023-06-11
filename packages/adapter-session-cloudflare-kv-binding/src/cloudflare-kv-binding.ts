import type { SessionSchema, SessionAdapter, InitializeAdapter } from "lucia";
import type { KVNamespace } from "@miniflare/kv";

export const DEFAULT_SESSION_PREFIX = "session";
export const DEFAULT_USER_SESSIONS_PREFIX = "user_sessions";

export const sAdd = async (ns: KVNamespace, key: string, value: string) => {
	const set: String[] | null = await ns.get(key, { type: "json" });

	if (!set) {
		const newSet = new Set([value]);
		await ns.put(key, JSON.stringify([...newSet]));
	} else {
		const newSet = new Set([...set, value]);
		await ns.put(key, JSON.stringify([...newSet]));
	}
};

const sRem = async (ns: KVNamespace, key: string, value: string) => {
	const set: String[] | null = await ns.get(key, { type: "json" });

	if (set) {
		const newSet = new Set([...set.filter((val) => val !== value)]);
		await ns.put(key, JSON.stringify([...newSet]));
	}
};

export const cloudflareKvBindingAdapter = (
	ns: KVNamespace,
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
			getSession: async (sessionId: string) => {
				const sessionData = await ns.get(sessionKey(sessionId), {
					type: "json"
				});
				if (!sessionData) return null;
				const session = sessionData as SessionSchema;
				return session;
			},
			getSessionsByUserId: async (userId: string) => {
				const sessionIds: string[] =
					(await ns.get(userSessionsKey(userId), { type: "json" })) || [];
				const sessionData = await Promise.all(
					sessionIds.map((sessionId: string) =>
						ns.get(sessionKey(sessionId), { type: "json" })
					)
				);
				const sessions = sessionData.filter(
					(val: SessionSchema | null) => val !== null
				) as SessionSchema[];
				return sessions;
			},
			setSession: async (session: SessionSchema) => {
				await Promise.all([
					sAdd(ns, userSessionsKey(session.user_id), session.id),
					ns.put(sessionKey(session.id), JSON.stringify(session), {
						expirationTtl: Math.floor(Number(session.idle_expires) / 1000)
					})
				]);
			},
			deleteSession: async (sessionId: string) => {
				const sessionData = await ns.get(sessionKey(sessionId), {
					type: "json"
				});
				if (!sessionData) return;
				const session = sessionData as SessionSchema;
				await Promise.all([
					ns.delete(sessionKey(sessionId)),
					sRem(ns, userSessionsKey(session.user_id), sessionId)
				]);
			},
			deleteSessionsByUserId: async (userId: string) => {
				const sessionIds: string[] =
					(await ns.get(userSessionsKey(userId), { type: "json" })) || [];

				await Promise.all([
					...sessionIds.map((sessionId: string) =>
						ns.delete(sessionKey(sessionId))
					),
					ns.delete(userSessionsKey(userId))
				]);
			},
			updateSession: async (
				sessionId: string,
				partialSession: Partial<SessionSchema>
			) => {
				const sessionData = await ns.get(sessionKey(sessionId), {
					type: "json"
				});
				if (!sessionData) return;
				const session = sessionData as SessionSchema;
				const updatedSession = {
					...session,
					...partialSession
				};
				await ns.put(sessionKey(sessionId), JSON.stringify(updatedSession), {
					expirationTtl: Math.floor(Number(updatedSession.idle_expires) / 1000)
				});
			}
		};
	};
};
