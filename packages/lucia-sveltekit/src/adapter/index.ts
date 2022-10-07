import { SessionSchema, UserSchema } from "../types.js";

export interface Adapter {
    getUserById: (userId: string) => Promise<UserSchema | null>;
    getUserByProviderId: (providerId: string) => Promise<UserSchema | null>;
    getUserByAccessToken: (accessToken: string) => Promise<UserSchema | null>;
    setUser: (
        userId: string | null,
        data: {
            providerId: string;
            hashedPassword: string | null;
            userData: Record<string, any>;
        }
    ) => Promise<string>;
    deleteUser: (userId: string) => Promise<void>;
    updateUser: (
        userId: string,
        data: {
            providerId?: string | null;
            hashedPassword?: string | null;
            userData?: Record<string, any>;
        }
    ) => Promise<UserSchema>;
    getSessionByAccessToken: (
        accessToken: string
    ) => Promise<SessionSchema | null>;
    getSessionsByUserId: (userId: string) => Promise<SessionSchema[]>;
    setSession: (
        userId: string,
        accessToken: string,
        expires: number
    ) => Promise<void>;
    deleteSessionByAccessToken: (...accessToken: string[]) => Promise<void>;
    deleteSessionsByUserId: (userId: string) => Promise<void>;
    getUserIdByRefreshToken: (refreshToken: string) => Promise<string | null>;
    setRefreshToken: (refreshToken: string, userId: string) => Promise<void>;
    deleteRefreshToken: (...refreshToken: string[]) => Promise<void>;
    deleteRefreshTokensByUserId: (userId: string) => Promise<void>;
}

export const getUpdateData = (data: {
    providerId?: string | null;
    hashedPassword?: string | null;
    userData?: Record<string, any>;
}) => {
    const rawData: Record<string, any> = {
        provider_id: data.providerId,
        hashed_password: data.hashedPassword,
        ...convertCamelCaseKeysToSnakeCase(data.userData || {}),
    };
    const result: Record<string, any> = {};
    for (const key in rawData) {
        if (rawData[key] === undefined) continue;
        result[key] = rawData[key];
    }
    return result;
};

export const convertSnakeCaseKeysToCamelCase = (obj: Record<string, any>) => {
    return Object.fromEntries(
        Object.entries(obj).map(([key, values]) => {
            return [
                key.replace(/([-_][a-z])/g, (group: string) =>
                    group.toUpperCase().replace("-", "").replace("_", "")
                ),
                values,
            ];
        })
    );
};

export const convertCamelCaseKeysToSnakeCase = (obj: Record<string, any>) => {
    return Object.fromEntries(
        Object.entries(obj).map(([key, value]) => {
            return [
                key
                    .replace(/([A-Z])/g, " $1")
                    .split(" ")
                    .join("_")
                    .toLowerCase(),
                value,
            ];
        })
    );
};
