import { PostgrestClient } from "@supabase/postgrest-js"; // Supabase's realtime breaks adapter
import { LuciaError, adapterGetUpdateData } from "lucia-sveltekit";
import type { Adapter } from "lucia-sveltekit/types";
import { convertSessionRow, convertUserRow } from "./utils.js";

const adapter = (url: string, secret: string): Adapter => {
    const supabase = new PostgrestClient(`${url}/rest/v1`, {
        headers: {
            Authorization: `Bearer ${secret}`,
            apikey: secret,
        },
    });
    return {
        getUserById: async (userId) => {
            const { data, error } = await supabase
                .from<UserRow>("user")
                .select()
                .eq("id", userId)
                .maybeSingle();
            if (error) {
                console.error(error);
                throw new LuciaError("DATABASE_FETCH_FAILED");
            }
            if (!data) return null;
            return convertUserRow(data);
        },
        getUserIdByRefreshToken: async (refreshToken) => {
            const { data, error } = await supabase
                .from<
                    RefreshTokenRow & {
                        user: UserRow;
                    }
                >("refresh_token")
                .select("user_id")
                .eq("refresh_token", refreshToken)
                .maybeSingle();
            if (error) {
                console.error(error);
                throw new LuciaError("DATABASE_FETCH_FAILED");
            }
            if (!data) return null;
            return data.user_id;
        },
        getUserByProviderId: async (providerId) => {
            const { data, error } = await supabase
                .from<UserRow>("user")
                .select()
                .eq("provider_id", providerId)
                .maybeSingle();
            if (error) {
                console.error(error);
                throw new LuciaError("DATABASE_FETCH_FAILED");
            }
            if (!data) return null;
            return convertUserRow(data);
        },
        getUserByAccessToken: async (accessToken) => {
            const { data, error } = await supabase
                .from<SessionRow & { user: UserRow }>("sessions")
                .select("user(*)")
                .eq("access_token", accessToken)
                .maybeSingle();
            if (error) {
                console.error(error);
                throw new LuciaError("DATABASE_FETCH_FAILED");
            }
            if (!data) return null;
            return convertUserRow(data.user);
        },
        getSessionByAccessToken: async (accessToken) => {
            const { data, error } = await supabase
                .from<SessionRow>("session")
                .select("*, user(*)")
                .eq("access_token", accessToken)
                .maybeSingle();
            if (error) {
                console.error(error);
                throw new LuciaError("DATABASE_FETCH_FAILED");
            }
            if (!data) return null;
            return convertSessionRow(data);
        },
        getSessionsByUserId: async (userId) => {
            const { data, error } = await supabase
                .from<SessionRow>("session")
                .select("*, user(*)")
                .eq("user_id", userId);
            if (error) {
                console.error(error);
                throw new LuciaError("DATABASE_FETCH_FAILED");
            }
            return (
                data?.map((val) => {
                    return convertSessionRow(val);
                }) || []
            );
        },
        setUser: async (userId, data) => {
            const { data: dbData, error } = await supabase
                .from<UserRow>("user")
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
        setSession: async (userId, accessToken, expires) => {
            const { error } = await supabase.from("session").insert(
                {
                    access_token: accessToken,
                    user_id: userId,
                    expires,
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
                    error.details.includes("(access_token)") &&
                    error.details.includes("already exists.")
                ) {
                    throw new LuciaError("AUTH_DUPLICATE_ACCESS_TOKEN");
                }
                throw new LuciaError("DATABASE_UPDATE_FAILED");
            }
        },
        deleteSessionByAccessToken: async (...accessTokens) => {
            const { error } = await supabase
                .from("session")
                .delete({
                    returning: "minimal",
                })
                .in("access_token", accessTokens);
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
        setRefreshToken: async (refreshToken, userId) => {
            const { error } = await supabase.from("refresh_token").insert(
                {
                    user_id: userId,
                    refresh_token: refreshToken,
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
                    error.details.includes("(access_token)") &&
                    error.details.includes("already exists.")
                ) {
                    throw new LuciaError("AUTH_DUPLICATE_REFRESH_TOKEN");
                }
                throw new LuciaError("DATABASE_UPDATE_FAILED");
            }
        },
        deleteRefreshToken: async (...refreshTokens) => {
            const { error } = await supabase
                .from("refresh_token")
                .delete({
                    returning: "minimal",
                })
                .in("refresh_token", refreshTokens);
            if (error) {
                console.error(error);
                throw new LuciaError("DATABASE_UPDATE_FAILED");
            }
        },
        deleteRefreshTokensByUserId: async (userId) => {
            const { error } = await supabase
                .from("refresh_token")
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
            const dbData = adapterGetUpdateData(newData);
            const { data, error } = await supabase
                .from("user")
                .update(dbData)
                .eq("id", userId)
                .maybeSingle();
            if (error) {
                console.error(error);
                throw new LuciaError("DATABASE_FETCH_FAILED");
            }
            if (!data) throw new LuciaError("AUTH_INVALID_USER_ID");
            return data;
        },
    };
};

export default adapter;
