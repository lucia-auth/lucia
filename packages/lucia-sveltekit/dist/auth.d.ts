import { GetSession, Handle } from "@sveltejs/kit";
import { Adapter, LuciaUser } from "./types.js";
export declare const lucia: (configs: Configurations) => Lucia;
declare class Lucia {
    constructor(configs: Configurations);
    private handleTokens;
    private handleEndpoints;
    getAuthSession: GetSession;
    handleAuth: Handle;
    getUserFromRequest: (request: Request) => Promise<LuciaUser>;
    refreshAccessToken: (refreshToken: string, fingerprint: string) => Promise<{
        value: string;
        cookie: string;
    }>;
    createUser: (authId: string, identifier: string, options: {
        password?: string;
        user_data?: Record<string, any>;
    }) => Promise<{
        user: LuciaUser;
        access_token: string;
        refresh_token: string;
        fingerprint: string;
        cookies: {
            all: string[];
            access_token: string;
            refresh_token: string;
            fingerprint: string;
        };
    }>;
    getUser: (authId: string, identifier: string) => Promise<LuciaUser>;
    authenticateUser: (authId: string, identifier: string, password?: string) => Promise<{
        user: LuciaUser;
        access_token: string;
        refresh_token: string;
        fingerprint: string;
        cookies: {
            all: string[];
            access_token: string;
            refresh_token: string;
            fingerprint: string;
        };
    }>;
    deleteUser: (userId: string) => Promise<void>;
    private adapter;
    private secret;
    private generateUserId;
}
interface Configurations {
    adapter: Adapter;
    secret: string;
    generateUserId?: () => string;
}
export {};
