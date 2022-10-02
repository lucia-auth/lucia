import { PostgrestClient } from "@supabase/postgrest-js"; // Supabase's realtime breaks adapter
import { Error, adapterGetUpdateData } from "lucia-sveltekit";
import type { Adapter, DatabaseUser } from "lucia-sveltekit/types";

interface UserRow {
    id: string;
    hashed_password: string;
    identifier_token: string;
    [user_data: string]: any;
}

interface SessionRow {
    id: number;
    access_token: string;
    expires: number;
    user_id: string;
    user: UserRow;
}

interface RefreshTokenRow {
    id: number;
    refresh_token: string;
    user_id: string;
}

const convertUserRow = (row: UserRow): DatabaseUser => {
    const {
        id,
        hashed_password: hashedPassword,
        identifier_token: identifierToken,
        ...userData
    } = row;
    return {
        id,
        hashedPassword,
        identifierToken,
        ...userData,
    };
};

const convertSessionRow = (row: SessionRow) => {
    const {
        id,
        access_token: accessToken,
        user_id: userId,
        expires,
        user: userRow,
    } = row;
    return {
        id,
        accessToken,
        userId,
        expires,
        user: convertUserRow(userRow),
    };
};

const adapter = (url: string, secret: string): Adapter => {
    const supabase = new PostgrestClient(`${url}/rest/v1`, {
        headers: {
            Authorization: `Bearer ${secret}`,
            apikey: secret,
        },
    });
    return {
        getUserById: async (userId: string) => {
            const { data, error } = await supabase
                .from<UserRow>("user")
                .select()
                .eq("id", userId)
                .maybeSingle();
            if (error) {
                console.error(error);
                throw new Error("DATABASE_FETCH_FAILED");
            }
            if (!data) return null;
            return convertUserRow(data);
        },
        getUserByRefreshToken: async (refreshToken: string) => {
            const { data, error } = await supabase
                .from<
                    RefreshTokenRow & {
                        user: UserRow;
                    }
                >("refresh_token")
                .select("user(*)")
                .eq("refresh_token", refreshToken)
                .maybeSingle();
            if (error) {
                console.error(error);
                throw new Error("DATABASE_FETCH_FAILED");
            }
            if (!data) return null;
            return convertUserRow(data.user);
        },
        getUserByIdentifierToken: async (identifierToken: string) => {
            const { data, error } = await supabase
                .from<UserRow>("user")
                .select()
                .eq("identifier_token", identifierToken)
                .maybeSingle();
            if (error) {
                console.error(error);
                throw new Error("DATABASE_FETCH_FAILED");
            }
            if (!data) return null;
            return convertUserRow(data);
        },
        getSessionByAccessToken: async (accessToken) => {
            const { data, error } = await supabase
                .from<SessionRow>("session")
                .select("*, user(*)")
                .eq("access_token", accessToken)
                .maybeSingle();
            if (error) {
                console.log(error);
                throw new Error("DATABASE_FETCH_FAILED");
            }
            if (!data) return null;
            return convertSessionRow(data)
        },
        getSessionsByUserId: async (userId) => {
            const { data, error } = await supabase
                .from<SessionRow>("session")
                .select("*, user(*)")
                .eq("user_id", userId);
            if (error) {
                console.log(error);
                throw new Error("DATABASE_FETCH_FAILED");
            }
            return data?.map((val) => {
                return convertSessionRow(val)
            }) || [];
        },
        setUser: async (
            userId: string,
            data: {
                hashedPassword: string | null;
                identifierToken: string;
                userData: Record<string, any>;
            }
        ) => {
            const { error } = await supabase.from("user").insert(
                {
                    id: userId,
                    identifier_token: data.identifierToken,
                    hashed_password: data.hashedPassword,
                    ...data.userData,
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
                .from("user")
                .delete({
                    returning: "minimal",
                })
                .eq("id", userId);
            if (error) {
                console.error(error);
                throw new Error("DATABASE_UPDATE_FAILED");
            }
        },
        setSession: async (accessToken, expires, userId) => {
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
                console.log(error);
                throw new Error("DATABASE_UPDATE_FAILED");
            }
        },
        deleteSessionByAccessToken: async (accessToken) => {
            const { error } = await supabase
                .from("session")
                .delete({
                    returning: "minimal",
                })
                .eq("access_token", accessToken);
            if (error) {
                console.error(error);
                throw new Error("DATABASE_UPDATE_FAILED");
            }
        },
        deleteSessionByUserId: async (userId) => {
            const { error } = await supabase
                .from("session")
                .delete({
                    returning: "minimal",
                })
                .eq("user_id", userId);
            if (error) {
                console.error(error);
                throw new Error("DATABASE_UPDATE_FAILED");
            }
        },
        setRefreshToken: async (refreshToken: string, userId: string) => {
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
                throw new Error("DATABASE_UPDATE_FAILED");
            }
        },
        deleteRefreshToken: async (refreshToken: string) => {
            const { error } = await supabase
                .from("refresh_token")
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
                .from("refresh_token")
                .delete({
                    returning: "minimal",
                })
                .eq("user_id", userId);
            if (error) {
                console.error(error);
                throw new Error("DATABASE_UPDATE_FAILED");
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
                throw new Error("DATABASE_FETCH_FAILED");
            }
            return data || null;
        },
    };
};

export default adapter;
