import { LuciaError } from "../../error.js";
import type { User, Session, SessionSchema, UserSchema, Auth } from "../../types.js";

type GetUser = (provider: string, identifier: string) => Promise<User>;

export const getUserByProviderIdFunction = (auth: Auth) => {
	const getUserByProviderId: GetUser = async (provider, identifier) => {
		const providerId = `${provider}:${identifier}`;
		const databaseUser = await auth.configs.adapter.getUserByProviderId(providerId);
		if (!databaseUser) throw new LuciaError("AUTH_INVALID_PROVIDER_ID");
		const user = auth.configs.transformUserData(databaseUser);
		return user;
	};
	return getUserByProviderId;
};

type GetUserById = (userId: string) => Promise<User>;

export const getUserFunction = (auth: Auth) => {
	const getUser: GetUserById = async (userId: string) => {
		const databaseUser = await auth.configs.adapter.getUser(userId);
		if (!databaseUser) throw new LuciaError("AUTH_INVALID_USER_ID");
		const user = auth.configs.transformUserData(databaseUser);
		return user;
	};
	return getUser;
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
