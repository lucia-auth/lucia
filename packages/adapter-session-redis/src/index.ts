import type {
	SessionSchema,
	SessionAdapter,
	AdapterFunction
} from "lucia-auth";
import type { RedisClientType } from "redis";
import { LuciaError } from "lucia-auth";

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

		const getSession = async (sessionId: string) => {
			const sessionData = await redisClient.get(
				`${sessionNamespace}:${sessionId}`
			);
			if (!sessionData) return null;
			return JSON.parse(sessionData) as SessionSchema;
		};

		const getSessionsByUserId = async (userId: string) => {
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
		};

		const setSession = async (session: SessionSchema) => {
			if (await getSession(session.id))
				throw new LuciaError("AUTH_DUPLICATE_SESSION_ID");

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
		};

		const deleteSession = async (...sessionIds: string[]) => {
			const targetSessionData = await Promise.all(
				sessionIds.map((id) => redisClient.get(`${sessionNamespace}:${id}`))
			);
			const sessions = targetSessionData
				.filter((val): val is string => val !== null)
				.map((val) => JSON.parse(val) as SessionSchema);
			await Promise.all([
				...sessionIds.map((id) => redisClient.del(`${sessionNamespace}:${id}`)),
				...sessions.map((session) =>
					redisClient.lRem(
						`${userSessionNamespace}:${session.user_id}`,
						0,
						session.id
					)
				)
			]);
		};

		const deleteSessionsByUserId = async (userId: string) => {
			const sessionIds = await redisClient.lRange(
				`${userSessionNamespace}:${userId}`,
				0,
				-1
			);
			await Promise.all([
				...sessionIds.map((id) => redisClient.del(`${sessionNamespace}:${id}`)),
				redisClient.del(`${userSessionNamespace}:${userId}`)
			]);
		};

		return {
			getSession,
			getSessionsByUserId,
			setSession,
			deleteSession,
			deleteSessionsByUserId
		};
	};

export { AdapterSessionRedisOptions };
export default adapter;
