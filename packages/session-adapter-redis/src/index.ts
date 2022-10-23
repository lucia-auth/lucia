import { LuciaError } from "lucia-sveltekit";
import type { SessionSchema, SessionAdapter } from "lucia-sveltekit/types";
import type { RedisClientType, ErrorReply } from "redis";

const adapter = (
    redisClient: {
        session: RedisClientType<any, any, any>;
        userSessions: RedisClientType<any, any, any>;
    },
    errorHandler: (error: any) => void = () => {}
): SessionAdapter => {
    const { session: sessionRedis, userSessions: userSessionsRedis } =
        redisClient;
    return {
        getSession: async (sessionId) => {
            try {
                const sessionData = await sessionRedis.get(sessionId);
                if (!sessionData) return null;
                const session = JSON.parse(sessionData) as SessionSchema;
                return session;
            } catch (e) {
                errorHandler(e as any);
                throw e;
            }
        },
        getSessionsByUserId: async (userId) => {
            try {
                const sessionIds = await userSessionsRedis.lRange(
                    userId,
                    0,
                    -1
                );
                const sessionData = await Promise.all(
                    sessionIds.map((id) => sessionRedis.get(id))
                );
                const sessions = sessionData
                    .filter((val): val is string => val !== null)
                    .map((val) => JSON.parse(val) as SessionSchema);
                return sessions;
            } catch (e) {
                errorHandler(e as any);
                throw e;
            }
        },
        setSession: async (sessionId, data) => {
            try {
                Promise.all([
                    userSessionsRedis.lPush(data.userId, sessionId),
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
                errorHandler(e as any);
                throw e;
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
                        userSessionsRedis.lRem(session.user_id, 1, session.id)
                    ),
                ]);
            } catch (e) {
                errorHandler(e as any);
                throw e;
            }
        },
        deleteSessionsByUserId: async (userId) => {
            try {
                const sessionIds = await userSessionsRedis.lRange(
                    userId,
                    0,
                    -1
                );
                await Promise.all([
                    ...sessionIds.map((id) => sessionRedis.del(id)),
                    userSessionsRedis.del(userId),
                ]);
            } catch (e) {
                errorHandler(e as any);
                throw e;
            }
        },
    };
};

export default adapter;
