import type { LuciaError } from "./error.js";

export type User = ReturnType<Lucia.Auth["context"]["transformUserData"]>;

export type Session = {
    sessionId: string;
    userId: string;
    expires: number;
};

export type Env = "DEV" | "PROD";
export type Error = typeof LuciaError;

export type GetSession = () => Session | null