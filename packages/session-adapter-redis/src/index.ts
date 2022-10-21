import { LuciaError } from "lucia-sveltekit";
import {
    type SessionSchema,
    type SessionAdapter,
} from "lucia-sveltekit/adapter";
import type { RedisClientType } from "redis";

const adapter = (redisInstances: {
    session: RedisClientType<any, any, any>;
    userSession: RedisClientType<any, any, any>;
}): SessionAdapter => {
    const { session: sessionRedis, userSession: userSessionRedis } =
        redisInstances;
    return {
        getSession: async (sessionId) => {
            try {
                const sessionData = await sessionRedis.get(sessionId);
                if (!sessionData) return null;
                const session = JSON.parse(sessionData) as SessionSchema;
                return session;
            } catch (e) {
                if (e instanceof LuciaError) throw e;
                console.error(e);
                throw new LuciaError("DATABASE_FETCH_FAILED");
            }
        },
        getSessionsByUserId: async (userId) => {
            try {
                const sessionIds = await userSessionRedis.lRange(userId, 0, -1);
                const sessionData = await Promise.all(
                    sessionIds.map((id) => sessionRedis.get(id))
                );
                const sessions = sessionData
                    .filter((val): val is string => val !== null)
                    .map((val) => JSON.parse(val) as SessionSchema);
                return sessions;
            } catch (e) {
                console.error(e);
                throw new LuciaError("DATABASE_UPDATE_FAILED");
            }
        },
        setSession: async (sessionId, data) => {
            try {
                Promise.all([
                    userSessionRedis.lPush(data.userId, sessionId),
                    sessionRedis.set(
                        sessionId,
                        JSON.stringify({
                            id: sessionId,
                            expires: data.expires,
                            idle_expires: data.idlePeriodExpires,
                            user_id: data.userId,
                        }),
                        {
                            EX: Math.floor(data.idlePeriodExpires / 1000),
                        }
                    ),
                ]);
            } catch (e) {
                console.error(e);
                throw new LuciaError("DATABASE_UPDATE_FAILED");
            }
        },
        deleteSession: async (...sessionIds) => {
            try {
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
                    ),
                ]);
            } catch (e) {
                console.error(e);
                throw new LuciaError("DATABASE_UPDATE_FAILED");
            }
        },
        deleteSessionsByUserId: async (userId) => {
            try {
                const sessionIds = await userSessionRedis.lRange(userId, 0, -1);
                await Promise.all([
                    ...sessionIds.map((id) => sessionRedis.del(id)),
                    userSessionRedis.del(userId),
                ]);
            } catch (e) {
                console.error(e);
                throw new LuciaError("DATABASE_UPDATE_FAILED");
            }
        },
    };
};

export default adapter;
