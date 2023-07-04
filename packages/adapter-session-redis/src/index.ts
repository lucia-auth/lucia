import type {
	SessionSchema,
	SessionAdapter,
	AdapterFunction
} from "lucia-auth";
import type { RedisClientType } from "redis";

const adapter =
	(redisClient: {
		session: RedisClientType<any, any, any>;
		userSession: RedisClientType<any, any, any>;
	}): AdapterFunction<SessionAdapter> =>
	() => {
		const { session: sessionRedis, userSession: userSessionRedis } =
			redisClient;
		return {
			getSession: async (sessionId) => {
				const sessionData = await sessionRedis.get(sessionId);
				if (!sessionData) return null;
				const session = JSON.parse(sessionData) as SessionSchema;
				return session;
			},
			getSessionsByUserId: async (userId) => {
				const sessionIds = await userSessionRedis.lRange(userId, 0, -1);
				const sessionData = await Promise.all(
					sessionIds.map((id) => sessionRedis.get(id))
				);
				const sessions = sessionData
					.filter((val): val is string => val !== null)
					.map((val) => JSON.parse(val) as SessionSchema);
				return sessions;
			},
			setSession: async (session) => {
				await Promise.all([
					userSessionRedis.lPush(session.user_id, session.id),
					sessionRedis.set(session.id, JSON.stringify(session), {
						EX: Math.floor(Number(session.idle_expires) / 1000)
					})
				]);
			},
			deleteSession: async (...sessionIds) => {
				const targetSessionData = await Promise.all(
					sessionIds.map((id) => sessionRedis.get(id))
				);
				const sessions = targetSessionData
					.filter((val): val is string => val !== null)
					.map((val) => JSON.parse(val) as SessionSchema);
				await Promise.all([
					...sessionIds.map((id) => sessionRedis.del(id)),
					...sessions.map((session) =>
						userSessionRedis.lRem(session.user_id, 1, session.id)
					)
				]);
			},
			deleteSessionsByUserId: async (userId) => {
				const sessionIds = await userSessionRedis.lRange(userId, 0, -1);
				await Promise.all([
					...sessionIds.map((id) => sessionRedis.del(id)),
					userSessionRedis.del(userId)
				]);
			}
		};
	};

export default adapter;
