import fauna, { type errors, type Client } from "faunadb";
import {
	convertUserResponse,
	type SingleResponse,
	type FaunaUserSchema,
	type FaunaSessionSchema,
	type MultiResponse
} from "./utils.js";
import type { Adapter, AdapterFunction } from "lucia-auth";

type AdapterConfig = {
	userTable?: string;
	sessionTable?: string;
};

type FaunaError = errors.FaunaError;

const adapter = (
	faunaClient: Client,
	config?: AdapterConfig
): AdapterFunction<Adapter> => {
	const { query } = fauna;
	const q = query;

	const userTable = config?.userTable ?? "user";
	const sessionTable = config?.sessionTable ?? "session";

	return (LuciaError) => {
		return {
			getUser: async (userId) => {
				const { data: userResponses } = await faunaClient.query<
					MultiResponse<FaunaUserSchema>
				>(
					q.Map(
						q.Paginate(q.Match(q.Index("user_by_id"), userId)),
						q.Lambda("x", q.Get(q.Var("x")))
					)
				);
				return userResponses.length > 0
					? convertUserResponse(userResponses[0])
					: null;
			},
			getUserByProviderId: async (providerId) => {
				const { data: userResponses } = await faunaClient.query<
					MultiResponse<FaunaUserSchema>
				>(
					q.Map(
						q.Paginate(q.Match(q.Index("user_by_providerid"), providerId)),
						q.Lambda("x", q.Get(q.Var("x")))
					)
				);
				return userResponses.length > 0
					? convertUserResponse(userResponses[0])
					: null;
			},
			getSessionAndUserBySessionId: async (sessionId) => {
				const { data: sessionResponses } = await faunaClient.query<
					MultiResponse<FaunaSessionSchema>
				>(
					q.Map(
						q.Paginate(q.Match(q.Index("session_by_id"), sessionId)),
						q.Lambda("x", q.Get(q.Var("x")))
					)
				);
				const session =
					sessionResponses.length > 0 ? sessionResponses[0].data : null;
				if (!session) return null;

				const { data: users } = await faunaClient.query<
					MultiResponse<FaunaUserSchema>
				>(
					q.Map(
						q.Paginate(q.Match(q.Index("user_by_id"), session["user_id"])),
						q.Lambda("x", q.Get(q.Var("x")))
					)
				);
				const user = users.length > 0 ? convertUserResponse(users[0]) : null;
				if (!user) return null;
				return {
					user: user,
					session: session
				};
			},
			getSession: async (sessionId) => {
				const { data: sessionResponses } = await faunaClient.query<
					MultiResponse<FaunaSessionSchema>
				>(
					q.Map(
						q.Paginate(q.Match(q.Index("session_by_id"), sessionId)),
						q.Lambda("x", q.Get(q.Var("x")))
					)
				);
				return sessionResponses.length > 0 ? sessionResponses[0].data : null;
			},
			getSessionsByUserId: async (userId) => {
				const { data: sessionResponses } = await faunaClient.query<
					MultiResponse<FaunaSessionSchema>
				>(
					q.Map(
						q.Paginate(q.Match(q.Index("session_by_userid"), userId)),
						q.Lambda("x", q.Get(q.Var("x")))
					)
				);
				return sessionResponses.map((response) => response.data);
			},
			setUser: async (userId, userData) => {
				try {
					const response = await faunaClient.query<
						SingleResponse<FaunaUserSchema>
					>(
						q.Create(q.Collection(userTable), {
							data: {
								id: userId ?? q.NewId(),
								hashed_password: userData.hashedPassword,
								provider_id: userData.providerId,
								...userData.attributes
							}
						})
					);
					return convertUserResponse(response);
				} catch (e) {
					const error = e as Partial<FaunaError>;
					if (error.message === "instance not unique") {
						throw new LuciaError("AUTH_DUPLICATE_PROVIDER_ID");
					}
					throw error;
				}
			},
			deleteUser: async (userId) => {
				await faunaClient.query(
					q.Map(
						q.Paginate(q.Match(q.Index("user_by_id"), userId)),
						q.Lambda("x", q.Delete(q.Var("x")))
					)
				);
			},
			setSession: async (sessionId, data) => {
				const { data: users } = await faunaClient.query<
					SingleResponse<FaunaUserSchema>
				>(
					q.Map(
						q.Paginate(q.Match(q.Index("user_by_id"), data.userId)),
						q.Lambda("x", q.Get(q.Var("x")))
					)
				);
				const user = users.length > 0 ? users[0].data : null;
				if (!user) throw new LuciaError("AUTH_INVALID_USER_ID");
				try {
					await faunaClient.query<SingleResponse<FaunaSessionSchema>>(
						q.Create(q.Collection(sessionTable), {
							data: {
								id: sessionId,
								user_id: data.userId,
								expires: data.expires,
								idle_expires: data.idlePeriodExpires
							}
						})
					);
				} catch (e) {
					const error = e as Partial<FaunaError>;
					if (error.message === "instance not unique") {
						throw new LuciaError("AUTH_DUPLICATE_SESSION_ID");
					}
					throw error;
				}
			},
			deleteSession: async (...sessionIds) => {
				await faunaClient.query(
					q.Map(
						q.Paginate(
							q.Union(
								q.Map(
									[...sessionIds],
									q.Lambda("x", q.Match(q.Index("session_by_id"), q.Var("x")))
								)
							)
						),
						q.Lambda("x", q.Delete(q.Var("x")))
					)
				);
			},
			deleteSessionsByUserId: async (userId) => {
				await faunaClient.query(
					q.Map(
						q.Paginate(q.Match(q.Index("session_by_userid"), userId)),
						q.Lambda("x", q.Delete(q.Var("x")))
					)
				);
			},
			updateUser: async (userId, newData) => {
				try {
					const { data: userResponses } = await faunaClient.query<
						MultiResponse<FaunaUserSchema>
					>(
						q.Map(
							q.Paginate(q.Match(q.Index("user_by_id"), userId)),
							q.Lambda(
								"x",
								q.Update(q.Var("x"), {
									data: {
										hashed_password: newData.hashedPassword,
										provider_id: newData.providerId,
										...newData.attributes
									}
								})
							)
						)
					);
					if (userResponses.length === 0) {
						throw new LuciaError("AUTH_INVALID_USER_ID");
					}
					return convertUserResponse(userResponses[0]);
				} catch (e) {
					const error = e as Partial<FaunaError>;
					if (error.message === "instance not unique") {
						throw new LuciaError("AUTH_DUPLICATE_PROVIDER_ID");
					}
					throw error;
				}
			}
		};
	};
};

export default adapter;
