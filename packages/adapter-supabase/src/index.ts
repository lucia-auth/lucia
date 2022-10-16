import { PostgrestClient } from "@supabase/postgrest-js"; // Supabase's realtime breaks adapter
import { LuciaError } from "lucia-sveltekit";
import {
    type Adapter,
    getUpdateData,
    UserSchema,
    SessionSchema,
} from "lucia-sveltekit/adapter";

const adapter = (url: string, secret: string): Adapter => {
    const supabase = new PostgrestClient(`${url}/rest/v1`, {
        headers: {
            Authorization: `Bearer ${secret}`,
            apikey: secret,
        },
    });
    return {
        getUser: async (userId) => {
            const { data, error } = await supabase
                .from<UserSchema>("user")
                .select()
                .eq("id", userId)
                .maybeSingle();
            if (error) {
                console.error(error);
                throw new LuciaError("DATABASE_FETCH_FAILED");
            }
            if (!data) return null;
            return data;
        },
        getUserByProviderId: async (providerId) => {
            const { data, error } = await supabase
                .from<UserSchema>("user")
                .select()
                .eq("provider_id", providerId)
                .maybeSingle();
            if (error) {
                console.error(error);
                throw new LuciaError("DATABASE_FETCH_FAILED");
            }
            if (!data) return null;
            return data;
        },
        getSessionAndUserBySessionId: async (sessionId) => {
            const { data, error } = await supabase
                .from<SessionSchema & { user: UserSchema }>("session")
                .select("user(*), *")
                .eq("id", sessionId)
                .maybeSingle();
            if (error) {
                console.error(error);
                throw new LuciaError("DATABASE_FETCH_FAILED");
            }
            if (!data) return null;
            const { user, ...session } = data;
            return {
                user,
                session,
            };
        },
        getSession: async (sessionId) => {
            const { data, error } = await supabase
                .from<SessionSchema>("session")
                .select("*, user(*)")
                .eq("id", sessionId)
                .maybeSingle();
            if (error) {
                console.error(error);
                throw new LuciaError("DATABASE_FETCH_FAILED");
            }
            if (!data) return null;
            return data;
        },
        getSessionsByUserId: async (userId) => {
            const { data, error } = await supabase
                .from<SessionSchema>("session")
                .select("*, user(*)")
                .eq("user_id", userId);
            if (error) {
                console.error(error);
                throw new LuciaError("DATABASE_FETCH_FAILED");
            }
            return (
                data?.map((val) => {
                    return val;
                }) || []
            );
        },
        setUser: async (userId, data) => {
            const { data: dbData, error } = await supabase
                .from<UserSchema>("user")
                .insert(
                    {
                        id: userId || undefined,
                        provider_id: data.providerId,
                        hashed_password: data.hashedPassword,
                        ...data.userData,
                    },
                    {
                        returning: "representation",
                    }
                );
            if (error) {
                console.error(error);
                if (
                    error.details.includes("(provider_id)") &&
                    error.details.includes("already exists.")
                ) {
                    throw new LuciaError("AUTH_DUPLICATE_PROVIDER_ID");
                }
                if (error.details.includes("already exists.")) {
                    throw new LuciaError("AUTH_DUPLICATE_USER_DATA");
                }
                throw new LuciaError("DATABASE_UPDATE_FAILED");
            }
            return dbData[0].id;
        },
        deleteUser: async (userId) => {
            const { error } = await supabase
                .from("user")
                .delete({
                    returning: "minimal",
                })
                .eq("id", userId);
            if (error) {
                console.error(error);
                throw new LuciaError("DATABASE_UPDATE_FAILED");
            }
        },
        setSession: async (sessionId, data) => {
            const { error } = await supabase
                .from<SessionSchema>("session")
                .insert(
                    {
                        id: sessionId,
                        expires: data.expires,
                        renew_expires: data.renewalPeriodExpires,
                        user_id: data.userId,
                    },
                    {
                        returning: "minimal",
                    }
                );
            if (error) {
                console.error(error);
                if (
                    error.details.includes("is not present in table") &&
                    error.details.includes("user_id")
                ) {
                    throw new LuciaError("AUTH_INVALID_USER_ID");
                }
                if (
                    error.details.includes("(id)") &&
                    error.details.includes("already exists.")
                ) {
                    throw new LuciaError("AUTH_DUPLICATE_SESSION_ID");
                }
                throw new LuciaError("DATABASE_UPDATE_FAILED");
            }
        },
        deleteSession: async (...sessionIds) => {
            const { error } = await supabase
                .from("session")
                .delete({
                    returning: "minimal",
                })
                .in("id", sessionIds);
            if (error) {
                console.error(error);
                throw new LuciaError("DATABASE_UPDATE_FAILED");
            }
        },
        deleteSessionsByUserId: async (userId) => {
            const { error } = await supabase
                .from("session")
                .delete({
                    returning: "minimal",
                })
                .eq("user_id", userId);
            if (error) {
                console.error(error);
                throw new LuciaError("DATABASE_UPDATE_FAILED");
            }
        },
        updateUser: async (userId, newData) => {
            const dbData = getUpdateData(newData);
            const { data, error } = await supabase
                .from("user")
                .update(dbData)
                .eq("id", userId)
                .maybeSingle();
            if (error) {
                console.error(error);
                if (
                    error.details.includes("(provider_id)") &&
                    error.details.includes("already exists.")
                ) {
                    throw new LuciaError("AUTH_DUPLICATE_PROVIDER_ID");
                }
                if (error.details.includes("already exists.")) {
                    throw new LuciaError("AUTH_DUPLICATE_USER_DATA");
                }
                throw new LuciaError("DATABASE_FETCH_FAILED");
            }
            if (!data) throw new LuciaError("AUTH_INVALID_USER_ID");
            return data;
        },
    };
};

export default adapter;
