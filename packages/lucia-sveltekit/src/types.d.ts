import type { LoadEvent, ServerLoadEvent } from "./kit.js";
import type { LuciaError } from "./utils/error.js";
import type { FingerprintToken, RefreshToken, AccessToken } from "./utils/token.js";

type getSession = () => Promise<Session>
export type AuthServerLoadEvent = ServerLoadEvent & { getSession: getSession }
export type AuthLoadEvent = LoadEvent & { getSession: getSession }

export interface Adapter {
    getUserByRefreshToken: (
        refreshToken: string
    ) => Promise<DatabaseUser | null>;
    getUserByIdentifierToken: (
        identifierToken: string
    ) => Promise<DatabaseUser | null>;
    getUserById: (
        identifierToken: string
    ) => Promise<DatabaseUser | null>;
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
    ) => Promise<DatabaseUser>;
}

export type User = Lucia.UserData & {
    user_id: string;
};

export interface TokenData {
    fingerprint_hash: string;
    iat: number;
    exp: number;
    role: "access_token" | "refresh_token"
}

export type DatabaseUser = {
    id: string;
    hashed_password: string | null;
    identifier_token: string;
} & Lucia.UserData;

export type Session = {
    user: User;
    access_token: string;
    refresh_token: string;
} | null;

export interface ServerSession {
    user: User;
    access_token: AccessToken;
    refresh_token: RefreshToken;
    fingerprint_token: FingerprintToken;
    cookies: string[]
}

export type Env = "DEV" | "PROD";
export type Error = typeof LuciaError
