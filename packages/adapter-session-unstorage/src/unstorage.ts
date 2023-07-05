import { prefixStorage } from "unstorage";

import type { SessionSchema, SessionAdapter, InitializeAdapter } from "lucia";
import type { Storage } from "unstorage";

export const DEFAULT_SESSION_PREFIX = "session";
export const DEFAULT_USER_SESSION_PREFIX = "user_session";

export const unstorageAdapter = (
	storage: Storage,
	prefixes?: {
		session: string;
		userSession: string;
	}
): InitializeAdapter<SessionAdapter> => {
	return () => {
		const sessionStorage = prefixStorage<SessionSchema>(
			storage,
			prefixes?.session ?? DEFAULT_SESSION_PREFIX
		);
		const getUserSessionStorage = (userId: string) => {
			const prefix = [
				prefixes?.userSession ?? DEFAULT_USER_SESSION_PREFIX,
				userId
			].join(":");
			return prefixStorage<"">(storage, prefix);
		};

		return {
			getSession: async (sessionId) => {
				const sessionResult = (await sessionStorage.getItem(sessionId)) ?? null;
				return sessionResult;
			},
			getSessionsByUserId: async (userId) => {
				const userSessionStorage = getUserSessionStorage(userId);
				const sessionIds = await userSessionStorage.getKeys();
				const sessionResults = await Promise.all(
					sessionIds.map((sessionId) => {
						return sessionStorage.getItem(sessionId);
					})
				);
				return sessionResults.filter(
					(sessionResult): sessionResult is SessionSchema => !!sessionResult
				);
			},
			setSession: async (session) => {
				const userSessionStorage = getUserSessionStorage(session.user_id);
				await Promise.all([
					userSessionStorage.setItem(session.user_id, ""),
					sessionStorage.setItem(session.id, session)
				]);
			},
			deleteSession: async (sessionId) => {
				const sessionResult = (await sessionStorage.getItem(sessionId)) ?? null;
				if (!sessionResult) return;
				const sessionUserStorage = getUserSessionStorage(sessionId);
				await Promise.all([
					sessionStorage.removeItem(sessionId),
					sessionUserStorage.removeItem(sessionId)
				]);
			},
			deleteSessionsByUserId: async (userId) => {
				const userSessionStorage = getUserSessionStorage(userId);
				const sessionIds = await userSessionStorage.getKeys();
				await Promise.all([
					...sessionIds.map((sessionId) => {
						return sessionStorage.removeItem(sessionId);
					}),
					userSessionStorage.clear()
				]);
			},
			updateSession: async (sessionId, partialSession) => {
				const sessionResult = (await sessionStorage.getItem(sessionId)) ?? null;
				if (!sessionResult) return;
				const updatedSession = { ...sessionResult, ...partialSession };
				await sessionStorage.setItem(sessionId, updatedSession);
			}
		};
	};
};
