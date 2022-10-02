import { Writable } from "svelte/store";
import type { LoadEvent, ServerLoadEvent } from "./kit.js";
import type { LuciaError } from "./utils/error.js";

type getSession = () => Promise<Session>;
export type AuthServerLoadEvent = ServerLoadEvent & { getSession: getSession };
export type AuthLoadEvent = LoadEvent & { getSession: getSession };

export interface Adapter {
    getUserById: (userId: string) => Promise<DatabaseUser | null>;
    getUserByRefreshToken: (
        refreshToken: string
    ) => Promise<DatabaseUser | null>;
    getUserByIdentifierToken: (
        identifierToken: string
    ) => Promise<DatabaseUser | null>;
    getSessionByAccessToken: (accessToken: string) => Promise<DatabaseSession>;
    getAccessTokensByUserId: (userId: string) => Promise<DatabaseSession[]>
    setUser: (
        userId: string,
        data: {
            identifierToken: string;
            hashedPassword: string | null;
            userData: Record<string, any>;
        }
    ) => Promise<void>;
    deleteUser: (userId: string) => Promise<void>;
    setAccessToken: (
        accessToken: string,
        expires: number,
        userId: string
    ) => Promise<void>;
    setRefreshToken: (refreshToken: string, userId: string) => Promise<void>;
    deleteAccessToken: (...accessToken: string[]) => Promise<void>;
    deleteUserAccessTokens: (userId: string) => Promise<void>;
    deleteRefreshToken: (...refreshToken: string[]) => Promise<void>;
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
    userId: string;
    identifierToken: string;
};

export type DatabaseUser = {
    id: string;
    hashedPassword: string | null;
    identifierToken: string;
} & Lucia.UserData;

export type DatabaseSession = {
    id: string;
    accessToken: string;
    expires: number;
    user: DatabaseUser;
};

export type ServerSession = Tokens & Session;

export interface Tokens {
    accessToken: [string, string];
    refreshToken: [string, string];
    cookies: string[];
    expires: number;
}
export interface Session {
    user: User;
    expires: number;
}

export type SessionStore = Writable<Session | null>;

export type Env = "DEV" | "PROD";
export type Error = typeof LuciaError;
