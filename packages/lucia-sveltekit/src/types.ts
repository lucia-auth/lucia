import { Writable } from "svelte/store";
import type { LoadEvent, ServerLoadEvent } from "./kit.js";
import type { LuciaError } from "./utils/error.js";

type getSession = () => Promise<Session>;
export type AuthServerLoadEvent = ServerLoadEvent & { getSession: getSession };
export type AuthLoadEvent = LoadEvent & { getSession: getSession };

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

export type User = Lucia.UserData & {
    userId: string;
    providerId: string;
};

export type UserSchema = {
    id: string;
    hashedPassword: string | null;
    providerId: string;
} & Lucia.UserData;

export type SessionSchema = {
    accessToken: string;
    expires: number;
    userId: string;
};

export type ServerSession = {
    accessToken: [string, string];
    refreshToken: [string, string];
    cookies: string[];
} & Session;

export interface Session {
    userId: string;
    expires: number;
}

export type SessionStore = Writable<Session | null>;

export type Env = "DEV" | "PROD";
export type Error = typeof LuciaError;
