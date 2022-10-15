import type { LuciaError } from "./error.js";

export type User = Lucia.UserData & {
    userId: string;
    providerId: string;
};

export type UserSchema = {
    id: string;
    hashed_password: string | null;
    provider_id: string;
} & Lucia.UserData;

export type SessionSchema = {
    access_token: string;
    expires: number;
    user_id: string;
};

export type Tokens = {
    accessToken: [string, string];
    refreshToken: [string, string];
    cookies: string[];
};

export type Session = {
    userId: string;
    expires: number;
}

export type Env = "DEV" | "PROD";
export type Error = typeof LuciaError;
