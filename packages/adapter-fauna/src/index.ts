import { LuciaError } from "lucia-auth";
import type { Adapter } from "lucia-auth";
import faunadb, { errors, Client } from "faunadb";
import { convertUserResponse } from "./utils.js";
import FaunaError = errors.FaunaError;

const { query } = faunadb;
const q = query;

interface FaunaResponse { data?: any }

const adapter = (
	faunaClient: Client,
	errorHandler: (error: FaunaError) => void = () => {
	}): Adapter => {
	return {
		getUser: async (userId) => {
			try {
				const response: FaunaResponse = await faunaClient.query(q.Map(q.Paginate(q.Match(q.Index("user_by_id"), userId)), q.Lambda("x", q.Get(q.Var("x"))))).catch((err: FaunaError) => { throw err });
				const users = response.data;
				return users.length !== 0 ? users[0].data : null;

			} catch (e) {
				errorHandler(e as any);
				throw e;
			}
		}, getUserByProviderId: async (providerId) => {
			try {
				const response: FaunaResponse = await faunaClient.query(q.Map(q.Paginate(q.Match(q.Index("user_by_providerid"), providerId)), q.Lambda("x", q.Get(q.Var("x"))))).catch((err: FaunaError) => { throw err });
				const users = response.data;
				return users.length !== 0 ? users[0].data : null;

			} catch (e) {
				errorHandler(e as any);
				throw e;
			}
		}, getSessionAndUserBySessionId: async (sessionId) => {
			try {
				const sessionsResponse: FaunaResponse = await faunaClient.query(q.Map(q.Paginate(q.Match(q.Index("session_by_id"), sessionId)), q.Lambda("x", q.Get(q.Var("x"))))).catch((err: FaunaError) => { throw err });
				const sessions = sessionsResponse.data;
				const session = sessions.length !== 0 ? sessions[0].data : null;
				if (!session) return null;

				const userResponse: FaunaResponse = await faunaClient.query(q.Map(q.Paginate(q.Match(q.Index("user_by_id"), session["user_id"])), q.Lambda("x", q.Get(q.Var("x"))))).catch((err: FaunaError) => { throw err });
				const users = userResponse.data;
				const user = users.length !== 0 ? users[0].data : null;
				if (!user) return null;

				return {
					user: user, session: session
				};
			} catch (e) {
				errorHandler(e as any);
				throw e;
			}
		}, getSession: async (sessionId) => {
			try {
				const response: FaunaResponse = await faunaClient.query(q.Map(q.Paginate(q.Match(q.Index("session_by_id"), sessionId)), q.Lambda("x", q.Get(q.Var("x"))))).catch((err: FaunaError) => { throw err });
				const sessions = response.data;
				return sessions.length !== 0 ? sessions[0].data : null;

			} catch (e) {
				errorHandler(e as any);
				throw e;
			}
		}, getSessionsByUserId: async (userId) => {
			try {
				const response: FaunaResponse = await faunaClient.query(q.Map(q.Paginate(q.Match(q.Index("session_by_userid"), userId)), q.Lambda("x", q.Get(q.Var("x"))))).catch((err: FaunaError) => { throw err });
				return convertUserResponse(response.data);

			} catch (e) {
				errorHandler(e as any);
				throw e;
			}
		}, setUser: async (userId, userData) => {
			if (userId === null) throw new LuciaError("AUTO_USER_ID_GENERATION_NOT_SUPPORTED");
			try {
				const response: FaunaResponse = await faunaClient.query(q.Create(q.Collection("users"), {
					data: {
						id: userId,
						hashed_password: userData.hashedPassword,
						provider_id: userData.providerId, ...userData.attributes
					}
				})).catch((err: FaunaError) => {
					if (err.message === "instance not unique") {
						throw new LuciaError("AUTH_DUPLICATE_PROVIDER_ID");
					}
					throw err;
				});
				return response.data;

			} catch (e) {
				errorHandler(e as any);
				throw e;
			}
		}, deleteUser: async (userId) => {
			try {
				await faunaClient.query(q.Map(q.Paginate(q.Match(q.Index("user_by_id"), userId)), q.Lambda("x", q.Delete(q.Var("x"))))).catch((err: FaunaError) => { throw err });

			} catch (e) {
				errorHandler(e as any);
				throw e;
			}
		}, setSession: async (sessionId, session) => {
			let user;
			try {
				const response: FaunaResponse = await faunaClient.query(q.Map(q.Paginate(q.Match(q.Index("user_by_id"), session.userId)), q.Lambda("x", q.Get(q.Var("x"))))).catch((err: FaunaError) => { throw err });
				const users = response.data;
				user = users.length !== 0 ? users[0].data : null;

			} catch (e) {
				errorHandler(e as any);
				throw e;
			}

			if (!user) throw new LuciaError("AUTH_INVALID_USER_ID");

			try {
				const response: FaunaResponse = await faunaClient.query(q.Create(q.Collection("sessions"), {
					data: {
						id: sessionId, user_id: session.userId, expires: session.expires, idle_expires: session.idlePeriodExpires
					}
				})).catch((err: FaunaError) => {
					if (err.message === "instance not unique") {
						throw new LuciaError("AUTH_DUPLICATE_SESSION_ID");
					}
					throw err;
				});
				return response.data;

			} catch (e) {
				errorHandler(e as any);
				throw e;
			}
		}, deleteSession: async (...sessionIds) => {
			try {
				await faunaClient.query(q.Map(q.Paginate(q.Union(q.Map([...sessionIds], q.Lambda("x", q.Match(q.Index("session_by_id"), q.Var("x")))))), q.Lambda("x", q.Delete(q.Var("x"))))).catch((err: FaunaError) => { throw err });

			} catch (e) {
				errorHandler(e as any);
				throw e;
			}
		}, deleteSessionsByUserId: async (userId) => {
			try {
				await faunaClient.query(q.Map(q.Paginate(q.Match(q.Index("session_by_userid"), userId)), q.Lambda("x", q.Delete(q.Var("x"))))).catch((err: FaunaError) => { throw err });

			} catch (e) {
				errorHandler(e as any);
				throw e;
			}
		}, updateUser: async (userId, newData) => {
			const response: FaunaResponse = await faunaClient.query(q.Map(q.Paginate(q.Match(q.Index("user_by_id"), userId)), q.Lambda("x", q.Update(q.Var("x"), {
				data: {
					hashed_password: newData.hashedPassword, provider_id: newData.providerId, ...newData.attributes
				}
			}))))
				.catch((err: FaunaError) => {
					if (err.message === "instance not unique") {
						throw new LuciaError("AUTH_DUPLICATE_PROVIDER_ID");
					}
					throw err;
				});

			const users = response.data;

			if (users.length === 0) {
				throw new LuciaError("AUTH_INVALID_USER_ID");
			}
			return users[0].data;
		}
	};
};

export default adapter;
