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
    getUserByProviderId: (
        providerId: string
    ) => Promise<DatabaseUser | null>;
    getSessionByAccessToken: (accessToken: string) => Promise<DatabaseSession | null>;
    getSessionsByUserId: (userId: string) => Promise<DatabaseSession[]>
    setUser: (
        userId: string,
        data: {
            providerId: string;
            hashedPassword: string | null;
            userData: Record<string, any>;
        }
    ) => Promise<void>;
    deleteUser: (userId: string) => Promise<void>;
    setSession: (
        accessToken: string,
        expires: number,
        userId: string
    ) => Promise<void>;
    deleteSessionByAccessToken: (...accessToken: string[]) => Promise<void>;
    deleteUserSessions: (userId: string) => Promise<void>;
    setRefreshToken: (refreshToken: string, userId: string) => Promise<void>;
    deleteRefreshToken: (...refreshToken: string[]) => Promise<void>;
    deleteUserRefreshTokens: (userId: string) => Promise<void>;
    updateUser: (
        userId: string,
        data: {
            providerId?: string | null;
            hashedPassword?: string | null;
            userData?: Record<string, any>;
        }
    ) => Promise<DatabaseUser>;
}

export type User = Lucia.UserData & {
    userId: string;
    providerId: string;
};

export type DatabaseUser = {
    id: string;
    hashedPassword: string | null;
    providerId: string;
} & Lucia.UserData;

export type DatabaseSession = {
    id: number;
    accessToken: string;
    expires: number;
    userId: string;
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
