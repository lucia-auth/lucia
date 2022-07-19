import { GetSession, Handle } from "@sveltejs/kit";
import {
    compare,
    generateRandomString,
    hash,
    LuciaAccessToken,
} from "./utils/crypto.js";
import cookie from "cookie";
import { Adapter, LuciaUser } from "./types.js";
import {
    generateAccessToken,
    generateFingerprint,
    generateRefreshToken,
    getAccountFromDatabaseData,
    validateRefreshTokenFingerprint,
} from "./utils/auth.js";
import { LuciaError } from "./utils/error.js";
import { handleRefreshRequest } from "./endpoints/refresh.js";
import { handleLogoutRequest } from "./endpoints/logout.js";
import { sequence } from "@sveltejs/kit/hooks";

export const lucia = (configs: Configurations) => {
    return new Lucia(configs);
};

class Lucia {
    constructor(configs: Configurations) {
        this.adapter = configs.adapter;
        this.secret = configs.secret;
        this.generateUserId =
            configs.generateUserId || (() => generateRandomString(8));
    }
    private handleTokens: Handle = async ({ resolve, event }) => {
        const cookies = cookie.parse(event.request.headers.get("cookie") || "");
        const refreshToken = cookies.refresh_token;
        const fingerprint = cookies.fingerprint;
        try {
            if (!refreshToken) throw {};
            const accessToken = new LuciaAccessToken(cookies.access_token);
            await accessToken.verify(fingerprint, this.secret);
            const user = accessToken.user;
            event.locals.lucia = {
                user: user,
                access_token: accessToken.token,
                refresh_token: refreshToken,
            };
            const response = await resolve(event);
            return response;
        } catch {}
        try {
            // if access token is invalid
            if (!refreshToken) throw {};
            await validateRefreshTokenFingerprint(refreshToken, fingerprint);
            const databaseUser = await this.adapter.getUserFromRefreshToken(
                refreshToken
            );
            if (!databaseUser)
                throw new LuciaError("AUTH_INVALID_REFRESH_TOKEN");
            const account = getAccountFromDatabaseData(databaseUser);
            const accessToken = await generateAccessToken(
                account.user,
                fingerprint,
                this.secret
            );
            event.locals.lucia = {
                user: account.user,
                access_token: accessToken.value,
                refresh_token: refreshToken,
            };
            const response = await resolve(event);
            response.headers.set("set-cookie", accessToken.cookie);
            return response;
        } catch {
            // if refresh token is invalid
            event.locals.lucia = null;
            return await resolve(event);
        }
    };
    private handleEndpoints: Handle = async ({ resolve, event }) => {
        if (
            event.url.pathname === "/api/auth/refresh" &&
            event.request.method === "POST"
        ) {
            return await handleRefreshRequest(event, this.adapter, {
                secret: this.secret,
            });
        }
        if (
            event.url.pathname === "/api/auth/logout" &&
            event.request.method === "POST"
        ) {
            return await handleLogoutRequest(event, this.adapter);
        }
        return await resolve(event);
    };
    public getAuthSession: GetSession = async ({ locals }) => {
        return {
            lucia: locals.lucia,
        };
    };
    public handleAuth: Handle = (params: any) =>
        sequence(this.handleTokens, this.handleEndpoints)(params);
    public verifyRequest: (request: Request) => Promise<LuciaUser> = async (
        request
    ) => {
        const authorizationHeader = request.headers.get("Authorization") || "";
        const [tokenType, token] = authorizationHeader.split(" ");
        if (!tokenType || !token)
            throw new LuciaError("AUTH_INVALID_ACCESS_TOKEN");
        if (tokenType !== "Bearer")
            throw new LuciaError("AUTH_INVALID_ACCESS_TOKEN");
        if (!token) throw new LuciaError("AUTH_INVALID_ACCESS_TOKEN");
        const cookies = cookie.parse(request.headers.get("cookie") || "");
        const fingerprint = cookies.fingerprint;
        const accessToken = new LuciaAccessToken(cookies.access_token);
        await accessToken.verify(fingerprint, this.secret);
        const user = accessToken.user;
        return user;
    };
    public refreshAccessToken: (
        refreshToken: string,
        fingerprint: string
    ) => Promise<{
        value: string;
        cookie: string;
    }> = async (refreshToken, fingerprint) => {
        await validateRefreshTokenFingerprint(refreshToken, fingerprint);
        const databaseUser = await this.adapter.getUserFromRefreshToken(
            refreshToken
        );
        if (!databaseUser) throw new LuciaError("AUTH_INVALID_REFRESH_TOKEN");
        const account = getAccountFromDatabaseData(databaseUser);
        const accessToken = await generateAccessToken(
            account.user,
            fingerprint,
            this.secret
        );
        return {
            value: accessToken.value,
            cookie: accessToken.cookie,
        };
    };
    public createUser: (
        authId: string,
        identifier: string,
        options: {
            password?: string;
            user_data?: Record<string, any>;
        }
    ) => Promise<{
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
    }> = async (authId, identifier, options) => {
        const identifierToken = `${authId}:${identifier}`;
        const userId = this.generateUserId();
        const fingerprint = generateFingerprint();
        const refreshToken = await generateRefreshToken(fingerprint.value);
        const hashedPassword = options.password
            ? await hash(options.password)
            : null;
        const userData = options.user_data || {};
        await this.adapter.createUser(userId, {
            identifier_token: identifierToken,
            hashed_password: hashedPassword,
            user_data: userData,
        });
        await this.adapter.saveRefreshToken(refreshToken.value, userId);
        const user = {
            user_id: userId,
            ...userData,
        };
        const accessToken = await generateAccessToken(
            user,
            fingerprint.value,
            this.secret
        );
        return {
            user,
            access_token: accessToken.value,
            refresh_token: refreshToken.value,
            fingerprint: fingerprint.value,
            cookies: {
                all: [
                    accessToken.cookie,
                    refreshToken.cookie,
                    fingerprint.cookie,
                ],
                access_token: accessToken.cookie,
                refresh_token: refreshToken.cookie,
                fingerprint: fingerprint.cookie,
            },
        };
    };
    public getUser: (authId: string, identifier: string) => Promise<LuciaUser | null> =
        async (authId, identifier) => {
            const identifierToken = `${authId}:${identifier}`;
            const databaseData = await this.adapter.getUserFromIdentifierToken(
                identifierToken
            );
            if (!databaseData) return null
            const account = getAccountFromDatabaseData(databaseData);
            return account.user;
        };
    public authenticateUser: (
        authId: string,
        identifier: string,
        password?: string
    ) => Promise<{
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
    }> = async (authId, identifier, password) => {
        const identifierToken = `${authId}:${identifier}`;
        const databaseData = await this.adapter.getUserFromIdentifierToken(
            identifierToken
        );
        if (!databaseData)
            throw new LuciaError("AUTH_INVALID_IDENTIFIER_TOKEN");
        const account = getAccountFromDatabaseData(databaseData);
        if (account.hashed_password) {
            try {
                await compare(password || "", account.hashed_password);
            } catch {
                throw new LuciaError("AUTH_INVALID_PASSWORD");
            }
        }
        const userId = account.user.user_id;
        const fingerprint = generateFingerprint();
        const refreshToken = await generateRefreshToken(fingerprint.value);
        await this.adapter.saveRefreshToken(refreshToken.value, userId);
        const accessToken = await generateAccessToken(
            account.user,
            fingerprint.value,
            this.secret
        );
        return {
            user: account.user,
            access_token: accessToken.value,
            refresh_token: refreshToken.value,
            fingerprint: fingerprint.value,
            cookies: {
                all: [
                    accessToken.cookie,
                    refreshToken.cookie,
                    fingerprint.cookie,
                ],
                access_token: accessToken.cookie,
                refresh_token: refreshToken.cookie,
                fingerprint: fingerprint.cookie,
            },
        };
    };
    public deleteUser = async (userId: string) => {
        await this.adapter.deleteUserRefreshTokens(userId);
        await this.adapter.deleteUser(userId);
    };
    private adapter: Adapter;
    private secret: string;
    private generateUserId: () => string;
}

interface Configurations {
    adapter: Adapter;
    secret: string;
    generateUserId?: () => string;
}
