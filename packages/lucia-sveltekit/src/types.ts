import type { LuciaError } from "./error.js";

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

export type Session = {
    userId: string;
    expires: number;
}

export type Env = "DEV" | "PROD";
export type Error = typeof LuciaError;
