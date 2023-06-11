import type { SessionSchema, SessionAdapter, InitializeAdapter } from "lucia";
import type { Storage } from "unstorage";

export type UnstorageDriver = "cloudflarKvBinding" | "cloudflareKvHttp";

export const DEFAULT_SESSION_PREFIX = "session";
export const DEFAULT_USER_SESSIONS_PREFIX = "user_sessions";

export const sAdd = async (storage: Storage, key: string, value: string) => {
	const setData = await storage.getItemRaw(key);

	if (!setData) {
		const newSet = new Set([value]);
		await storage.setItem(key, JSON.stringify([...newSet]));
	} else {
		const set: string[] = JSON.parse(setData);
		const newSet = new Set([...set, value]);
		await storage.setItem(key, JSON.stringify([...newSet]));
	}
};

const sRem = async (storage: Storage, key: string, value: string) => {
	const setData = await storage.getItemRaw(key);

	if (setData) {
		const set: string[] = JSON.parse(setData);
		const newSet = new Set([...set.filter((val) => val !== value)]);
		await storage.setItem(key, JSON.stringify([...newSet]));
	}
};

const getOpts = (driver: UnstorageDriver, expire: number) => {
	// TODO: implement opts for all supported drivers
	return {
		expirationTtl: Math.floor(expire / 1000)
	};
};

export const unstorageAdapter = (
	storage: Storage,
	driver: UnstorageDriver,
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
				const sessionData = await storage.getItemRaw(sessionKey(sessionId));
				if (!sessionData) return null;
				const session = JSON.parse(sessionData) as SessionSchema;
				return session;
			},
			getSessionsByUserId: async (userId: string) => {
				const sessionIdsData =
					(await storage.getItemRaw(userSessionsKey(userId))) || "[]";
				const sessionIds = JSON.parse(sessionIdsData) as string[];

				const sessionData = await Promise.all(
					sessionIds.map((sessionId: string) =>
						storage.getItemRaw(sessionKey(sessionId))
					)
				);
				const sessions = sessionData
					.filter((val: string | null) => val !== null)
					.map((val: string) => JSON.parse(val)) as SessionSchema[];
				return sessions;
			},
			setSession: async (session: SessionSchema) => {
				await Promise.all([
					sAdd(storage, userSessionsKey(session.user_id), session.id),
					storage.setItem(
						sessionKey(session.id),
						JSON.stringify(session),
						getOpts(driver, Number(session.idle_expires))
					)
				]);
			},
			deleteSession: async (sessionId: string) => {
				const sessionData = await storage.getItemRaw(sessionKey(sessionId));
				if (!sessionData) return;
				const session = JSON.parse(sessionData) as SessionSchema;
				await Promise.all([
					storage.removeItem(sessionKey(sessionId)),
					sRem(storage, userSessionsKey(session.user_id), sessionId)
				]);
			},
			deleteSessionsByUserId: async (userId: string) => {
				const sessionIdsData =
					(await storage.getItemRaw(userSessionsKey(userId))) || "[]";
				const sessionIds = JSON.parse(sessionIdsData) as string[];

				await Promise.all([
					...sessionIds.map((sessionId: string) =>
						storage.removeItem(sessionKey(sessionId))
					),
					storage.removeItem(userSessionsKey(userId))
				]);
			},
			updateSession: async (
				sessionId: string,
				partialSession: Partial<SessionSchema>
			) => {
				const sessionData = await storage.getItemRaw(sessionKey(sessionId));
				if (!sessionData) return;
				const session = JSON.parse(sessionData) as SessionSchema;
				const updatedSession = {
					...session,
					...partialSession
				};
				await storage.setItem(
					sessionKey(sessionId),
					JSON.stringify(updatedSession),
					getOpts(driver, Number(session.idle_expires))
				);
			}
		};
	};
};
