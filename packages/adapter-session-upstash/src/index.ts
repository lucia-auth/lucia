import type { Redis } from "@upstash/redis";
import type {
	AdapterFunction,
	SessionAdapter,
	SessionSchema
} from "lucia-auth";

export const upstashAdapter =
	(upstashClient: Redis): AdapterFunction<SessionAdapter> =>
	() => {
		return {
			getSession: async (sessionId) => {
				const sessionData = await upstashClient.get(sessionId);
				if (!sessionData) return null;

				return sessionData as SessionSchema;
			},
			getSessionsByUserId: async (userId) => {
				const sessionIds = await upstashClient.lrange(userId, 0, -1);

				if (sessionIds.length === 0) return [];

				const pipeline = upstashClient.pipeline();
				sessionIds.forEach((id) => pipeline.get(id));
				const sessionData = await pipeline.exec<SessionSchema[]>();

				return sessionData;
			},
			setSession: async (session) => {
				const pipeline = upstashClient.pipeline();
				pipeline.lpush(session.user_id, session.id);
				pipeline.set(session.id, JSON.stringify(session), {
					ex: Math.floor(Number(session.idle_expires) / 1000)
				});
				await pipeline.exec();
			},
			deleteSession: async (...sessionIds) => {
				const pipeline = upstashClient.pipeline();
				sessionIds.forEach((id) => pipeline.get(id));
				const targetSessionData = await pipeline.exec<SessionSchema[]>();

				const pipeline2 = upstashClient.pipeline();
				sessionIds.forEach((id) => pipeline2.del(id));
				targetSessionData.forEach((session) =>
					pipeline2.lrem(session.user_id, 1, session.id)
				);

				await pipeline2.exec();
			},
			deleteSessionsByUserId: async (userId) => {
				const sessionIds = await upstashClient.lrange(userId, 0, -1);
				const pipeline = upstashClient.pipeline();

				sessionIds.forEach((id) => pipeline.del(id));
				pipeline.del(userId);

				await pipeline.exec();
			}
		};
	};

export default upstashAdapter;
