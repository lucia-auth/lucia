import type { ServerSession, User } from "../../types.js";
import { hashScrypt } from "../../utils/crypto.js";
import {
    createAccessToken,
    createAccessTokenCookie,
    createRefreshToken,
    createRefreshTokenCookie,
} from "../../utils/token.js";
import type { Context } from "../index.js";

type CreateUser = (
    authId: string,
    identifier: string,
    options: {
        password?: string;
        userData?: Lucia.UserData;
    }
) => Promise<ServerSession>;

export const createUserFunction = (context: Context) => {
    const createUser: CreateUser = async (authId, identifier, options) => {
        const identifierToken = `${authId}:${identifier}`;
        const userData = options.userData || {};
        const user = {
            userId: context.generateUserId(),
            ...userData,
        } as User;
        const [accessToken, accessTokenExpires] = createAccessToken();
        const refreshToken = createRefreshToken(user.userId, context);
        const hashedPassword = options.password
            ? await hashScrypt(options.password)
            : null;
        await context.adapter.setUser(user.userId, {
            identifierToken: identifierToken,
            hashedPassword: hashedPassword,
            userData: userData,
        });
        await Promise.all([
            context.adapter.setRefreshToken(refreshToken, user.userId),
            context.adapter.setSession(
                accessToken,
                accessTokenExpires,
                user.userId
            ),
        ]);
        const accessTokenCookie = createAccessTokenCookie(
            accessToken,
            accessTokenExpires,
            context
        );
        const refreshTokenCookie = createRefreshTokenCookie(
            refreshToken,
            context
        );
        return {
            user: user,
            accessToken: [accessToken, accessTokenCookie],
            refreshToken: [refreshToken, refreshTokenCookie],
            cookies: [accessTokenCookie, refreshTokenCookie],
            expires: accessTokenExpires
        };
    };
    return createUser;
};
