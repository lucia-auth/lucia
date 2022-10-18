import type { LuciaError } from "./error.js";

export type User = Lucia.User extends never ? { userId: string } : Lucia.User;

export type Session = {
    sessionId: string;
    userId: string;
    expires: number;
};

export type Env = "DEV" | "PROD";
export type Error = typeof LuciaError;
