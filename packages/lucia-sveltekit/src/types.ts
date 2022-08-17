import type { LuciaError } from "./utils/error.js";

export interface Adapter {
    getUserByRefreshToken: (
        refreshToken: string
    ) => Promise<DatabaseUser<Record<string, any>> | null>;
    getUserByIdentifierToken: (
        identifierToken: string
    ) => Promise<DatabaseUser<Record<string, any>> | null>;
    getUserById: (
        identifierToken: string
    ) => Promise<DatabaseUser<Record<string, any>> | null>;
    setUser: (
        userId: string,
        data: {
            identifier_token: string;
            hashed_password: string | null;
            user_data: Record<string, any>;
        }
    ) => Promise<void>;
    deleteUser: (userId: string) => Promise<void>;
    setRefreshToken: (refreshToken: string, userId: string) => Promise<void>;
    deleteRefreshToken: (refreshToken: string) => Promise<void>;
    deleteUserRefreshTokens: (userId: string) => Promise<void>;
    updateUser: (
        userId: string,
        data: {
            identifier_token?: string | null;
            hashed_password?: string | null;
            user_data?: Record<string, any>;
        }
    ) => Promise<DatabaseUser<Record<string, any>>>;
}

export type User<UserData extends {}> = UserData & {
    user_id: string;
};

export interface TokenData {
    fingerprint_hash: string;
    iat: number;
    exp: number;
    role: "access_token" | "refresh_token"
}

export type DatabaseUser<UserData> = {
    id: string;
    hashed_password: string | null;
    identifier_token: string;
} & UserData;

export type Session<UserData extends {}> = {
    user: User<UserData>;
    access_token: string;
    refresh_token: string;
} | null;

export type Env = "DEV" | "PROD";
export type Error = typeof LuciaError
