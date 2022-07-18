import { compare, generateRandomString, hash } from "./utils/crypto.js";
import cookie from "cookie";
import { generateAccessToken, generateFingerprint, generateRefreshToken, getAccountFromDatabaseData, getUserFromAccessToken, validateRefreshTokenFingerprint, } from "./utils/auth.js";
import { LuciaError } from "./utils/error.js";
import { handleRefreshRequest } from "./endpoints/refresh.js";
import { handleLogoutRequest } from "./endpoints/logout.js";
import { sequence } from "@sveltejs/kit/hooks";
export const lucia = (configs) => {
    return new Lucia(configs);
};
class Lucia {
    constructor(configs) {
        this.adapter = configs.adapter;
        this.secret = configs.secret;
        this.generateUserId =
            configs.generateUserId || (() => generateRandomString(8));
    }
    handleTokens = async ({ resolve, event }) => {
        const cookies = cookie.parse(event.request.headers.get("cookie") || "");
        const refreshToken = cookies.refresh_token;
        const fingerprint = cookies.fingerprint;
        try {
            if (!refreshToken)
                throw {};
            const accessToken = cookies.access_token;
            const user = await getUserFromAccessToken(accessToken, fingerprint, this.secret);
            event.locals.lucia = {
                user: user,
                access_token: accessToken,
                refresh_token: refreshToken,
            };
            const response = await resolve(event);
            return response;
        }
        catch { }
        try {
            // if access token is invalid
            if (!refreshToken)
                throw {};
            const validRefreshTokenFingerprint = await validateRefreshTokenFingerprint(refreshToken, fingerprint);
            if (!validRefreshTokenFingerprint)
                throw new LuciaError("AUTH_INVALID_REFRESH_TOKEN");
            const databaseUser = await this.adapter.getUserFromRefreshToken(refreshToken);
            if (!databaseUser)
                throw new LuciaError("AUTH_INVALID_REFRESH_TOKEN");
            const account = getAccountFromDatabaseData(databaseUser);
            const accessToken = await generateAccessToken(account.user, fingerprint, this.secret);
            event.locals.lucia = {
                user: account.user,
                access_token: accessToken.value,
                refresh_token: refreshToken,
            };
            const response = await resolve(event);
            response.headers.set("set-cookie", accessToken.cookie);
            return response;
        }
        catch {
            // if refresh token is invalid
            event.locals.lucia = null;
            return await resolve(event);
        }
    };
    handleEndpoints = async ({ resolve, event }) => {
        if (event.url.pathname === "/api/auth/refresh" &&
            event.request.method === "POST") {
            return await handleRefreshRequest(event, this.adapter, {
                secret: this.secret,
            });
        }
        if (event.url.pathname === "/api/auth/logout" &&
            event.request.method === "POST") {
            return await handleLogoutRequest(event, this.adapter);
        }
        return await resolve(event);
    };
    getAuthSession = async ({ locals }) => {
        return {
            lucia: locals.lucia,
        };
    };
    handleAuth = (params) => sequence(this.handleTokens, this.handleEndpoints)(params);
    getUserFromRequest = async (request) => {
        const authorizationHeader = request.headers.get("Authorization") || "";
        const [tokenType, accessToken] = authorizationHeader.split(" ");
        if (!tokenType || !accessToken)
            throw new LuciaError("AUTH_INVALID_ACCESS_TOKEN");
        if (tokenType !== "Bearer")
            throw new LuciaError("AUTH_INVALID_ACCESS_TOKEN");
        if (!accessToken)
            throw new LuciaError("AUTH_INVALID_ACCESS_TOKEN");
        const cookies = cookie.parse(request.headers.get("cookie") || "");
        const fingerprint = cookies.fingerprint;
        const user = await getUserFromAccessToken(accessToken, fingerprint, this.secret);
        return user;
    };
    refreshAccessToken = async (refreshToken, fingerprint) => {
        const validRefreshTokenFingerprint = await validateRefreshTokenFingerprint(refreshToken, fingerprint);
        if (!validRefreshTokenFingerprint)
            throw new LuciaError("AUTH_INVALID_REFRESH_TOKEN");
        const databaseUser = await this.adapter.getUserFromRefreshToken(refreshToken);
        if (!databaseUser)
            throw new LuciaError("AUTH_INVALID_REFRESH_TOKEN");
        const account = getAccountFromDatabaseData(databaseUser);
        const accessToken = await generateAccessToken(account.user, fingerprint, this.secret);
        return {
            value: accessToken.value,
            cookie: accessToken.cookie,
        };
    };
    createUser = async (authId, identifier, options) => {
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
        const accessToken = await generateAccessToken(user, fingerprint.value, this.secret);
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
    getUser = async (authId, identifier) => {
        const identifierToken = `${authId}:${identifier}`;
        const databaseData = await this.adapter.getUserFromIdentifierToken(identifierToken);
        if (!databaseData)
            throw new LuciaError("AUTH_INVALID_IDENTIFIER_TOKEN");
        const account = getAccountFromDatabaseData(databaseData);
        return account.user;
    };
    authenticateUser = async (authId, identifier, password) => {
        const identifierToken = `${authId}:${identifier}`;
        const databaseData = await this.adapter.getUserFromIdentifierToken(identifierToken);
        if (!databaseData)
            throw new LuciaError("AUTH_INVALID_IDENTIFIER_TOKEN");
        const account = getAccountFromDatabaseData(databaseData);
        if (account.hashed_password) {
            try {
                await compare(password || "", account.hashed_password);
            }
            catch {
                throw new LuciaError("AUTH_INVALID_PASSWORD");
            }
        }
        const userId = account.user.user_id;
        const fingerprint = generateFingerprint();
        const refreshToken = await generateRefreshToken(fingerprint.value);
        await this.adapter.saveRefreshToken(refreshToken.value, userId);
        const accessToken = await generateAccessToken(account.user, fingerprint.value, this.secret);
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
    deleteUser = async (userId) => {
        await this.adapter.deleteUserRefreshTokens(userId);
        await this.adapter.deleteUser(userId);
    };
    adapter;
    secret;
    generateUserId;
}
