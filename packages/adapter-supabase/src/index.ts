import { PostgrestClient } from "@supabase/postgrest-js";
import { Error } from "lucia-sveltekit";
import type { Adapter } from "lucia-sveltekit/dist/types";

const adapter = (
    url: string,
    secret: string
): Adapter => {
    const supabase = new PostgrestClient(`${url}/rest/v1`, {
        headers: {
            Authorization: `Bearer ${secret}`,
            apikey: secret,
        },
    });
    return {
        getUserFromRefreshToken: async (refreshToken: string) => {
            const { data, error } = await supabase
                .from("refresh_tokens")
                .select("user: users(*)")
                .eq("refresh_token", refreshToken)
                .maybeSingle();
            if (error) {
                console.error(error);
                throw new Error("DATABASE_FETCH_FAILED");
            }
            return data?.user || null;
        },
        getUserFromIdentifierToken: async (identifierToken: string) => {
            const { data, error } = await supabase
                .from("users")
                .select()
                .eq("identifier_token", identifierToken)
                .maybeSingle();
            if (error) throw new Error("DATABASE_FETCH_FAILED");
            return data || null;
        },
        createUser: async (
            userId: string,
            data: {
                hashed_password: string | null;
                identifier_token: string;
                user_data: Record<string, any>;
            }
        ) => {
            const { error } = await supabase.from("users").insert(
                {
                    id: userId,
                    identifier_token: data.identifier_token,
                    hashed_password: data.hashed_password,
                    ...data.user_data,
                },
                {
                    returning: "minimal",
                }
            );
            if (error) {
                console.error(error);
                if (
                    error.details.includes("(identifier_token)") &&
                    error.details.includes("already exists.")
                ) {
                    throw new Error("AUTH_DUPLICATE_IDENTIFIER_TOKEN");
                }
                if (error.details.includes("already exists.")) {
                    throw new Error("AUTH_DUPLICATE_USER_DATA");
                }
                throw new Error("DATABASE_UPDATE_FAILED");
            }
        },
        deleteUser: async (userId: string) => {
            const { error } = await supabase
                .from("users")
                .delete({
                    returning: "minimal",
                })
                .eq("id", userId);
            if (error) {
                console.error(error);
                throw new Error("DATABASE_UPDATE_FAILED");
            }
        },
        saveRefreshToken: async (refreshToken: string, userId: string) => {
            const { error } = await supabase.from("refresh_tokens").insert(
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
                throw new Error("DATABASE_UPDATE_FAILED");
            }
        },
        deleteRefreshToken: async (refreshToken: string) => {
            const { error } = await supabase
                .from("refresh_tokens")
                .delete({
                    returning: "minimal",
                })
                .eq("refresh_token", refreshToken);
            if (error) {
                console.error(error);
                throw new Error("DATABASE_UPDATE_FAILED");
            }
        },
        deleteUserRefreshTokens: async (userId: string) => {
            const { error } = await supabase
                .from("refresh_tokens")
                .delete({
                    returning: "minimal",
                })
                .eq("user_id", userId);
            if (error) {
                console.error(error);
                throw new Error("DATABASE_UPDATE_FAILED");
            }
        },
    };
};

export default adapter;
