import { getAccountFromDatabaseData } from "../utils/auth.js";
import { LuciaError } from "../utils/error.js";
import { AccessToken } from "../utils/token.js";
import { Context } from "./index.js";

export type RefreshAccessToken = (
    refreshToken: string,
    fingerprint: string
) => Promise<AccessToken>;
export const refreshAccessTokenFunction = (context: Context) => {
    const refreshAccessToken: RefreshAccessToken = async (
        refreshTokenValue,
        fingerprint
    ) => {
        const refreshToken = context.auth.refreshToken(refreshTokenValue);
        await refreshToken.validateFingerprint(fingerprint);
        const databaseUser = await context.adapter.getUserFromRefreshToken(
            refreshToken.value
        );
        if (!databaseUser) throw new LuciaError("AUTH_INVALID_REFRESH_TOKEN");
        const account = getAccountFromDatabaseData(databaseUser);
        const accessToken = await context.auth.createAccessToken(
            account.user,
            fingerprint
        );
        return accessToken;
    };
    return refreshAccessToken
};
