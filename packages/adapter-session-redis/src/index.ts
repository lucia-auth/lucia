import type {
	SessionSchema,
	SessionAdapter,
	AdapterFunction
} from "lucia-auth";
import type { RedisClientType } from "redis";

type AdapterSessionRedisOptions = {
	namespaces?: {
		session?: string;
		userSession?: string;
	};
};

const DEFAULT_SESSION_NAMESPACE = "session";
const DEFAULT_USER_SESSION_NAMESPACE = "userSession";

const adapter =
	(
		redisClient: RedisClientType<any, any, any>,
		options?: AdapterSessionRedisOptions
	): AdapterFunction<SessionAdapter> =>
	() => {
		const {
			namespaces: {
				session: sessionNamespace = DEFAULT_SESSION_NAMESPACE,
				userSession: userSessionNamespace = DEFAULT_USER_SESSION_NAMESPACE
			} = {}
		} = options ?? {};

		return {
			getSession: async (sessionId) => {
				const sessionData = await redisClient.get(
					`${sessionNamespace}:${sessionId}`
				);
				if (!sessionData) return null;
				return JSON.parse(sessionData) as SessionSchema;
			},
			getSessionsByUserId: async (userId) => {
				const sessionIds = await redisClient.lRange(
					`${userSessionNamespace}:${userId}`,
					0,
					-1
				);
				const sessionData = await Promise.all(
					sessionIds.map((id) => redisClient.get(`${sessionNamespace}:${id}`))
				);
				return sessionData
					.filter((val): val is string => val !== null)
					.map((val) => JSON.parse(val) as SessionSchema);
			},
			setSession: async (session) => {
				await Promise.all([
					redisClient.lPush(
						`${userSessionNamespace}:${session.user_id}`,
						session.id
					),
					redisClient.set(
						`${sessionNamespace}:${session.id}`,
						JSON.stringify(session),
						{
							EX: Math.floor(Number(session.idle_expires) / 1000)
						}
					)
				]);
			},
			deleteSession: async (...sessionIds) => {
				const targetSessionData = await Promise.all(
					sessionIds.map((id) => redisClient.get(`${sessionNamespace}:${id}`))
				);
				const sessions = targetSessionData
					.filter((val): val is string => val !== null)
					.map((val) => JSON.parse(val) as SessionSchema);
				await Promise.all([
					...sessionIds.map((id) =>
						redisClient.del(`${sessionNamespace}:${id}`)
					),
					...sessions.map((session) =>
						redisClient.lRem(
							`${userSessionNamespace}:${session.user_id}`,
							0,
							session.id
						)
					)
				]);
			},
			deleteSessionsByUserId: async (userId) => {
				const sessionIds = await redisClient.lRange(
					`${userSessionNamespace}:${userId}`,
					0,
					-1
				);
				await Promise.all([
					...sessionIds.map((id) =>
						redisClient.del(`${sessionNamespace}:${id}`)
					),
					redisClient.del(`${userSessionNamespace}:${userId}`)
				]);
			}
		};
	};

export { AdapterSessionRedisOptions };
export default adapter;
