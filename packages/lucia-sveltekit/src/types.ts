import { Writable } from "svelte/store";
import type { LoadEvent, ServerLoadEvent } from "./kit.js";
import type { LuciaError } from "./utils/error.js";

type getSession = () => Promise<Session>;
export type AuthServerLoadEvent = ServerLoadEvent & { getSession: getSession };
export type AuthLoadEvent = LoadEvent & { getSession: getSession };

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

export type Tokens = {
    accessToken: [string, string];
    refreshToken: [string, string];
    cookies: string[];
};

export interface Session {
    userId: string;
    expires: number;
}

export type UserStore = Writable<User | null>;

export type Env = "DEV" | "PROD";
export type Error = typeof LuciaError;
