import { convertSnakeCaseKeysToCamelCase } from "lucia-sveltekit/adapter";
import type { UserSchema } from "lucia-sveltekit/types";

export const convertUserRow = (row: UserRow): UserSchema => {
    const {
        id,
        hashed_password: hashedPassword,
        provider_id: providerId,
        ...userData
    } = row;
    return {
        id,
        hashedPassword,
        providerId,
        ...convertSnakeCaseKeysToCamelCase(userData) as Lucia.UserData,
    };
};

export const convertSessionRow = (row: SessionRow) => {
    const {
        id: _,
        access_token: accessToken,
        user_id: userId,
        expires,
    } = row;
    return {
        accessToken,
        userId,
        expires,
    };
};

export const convertRefreshTokenRow = (row: RefreshTokenRow): {
    refreshToken: string,
    userId: string
} => {
    const {
        id: _,
        user_id: userId,
        refresh_token: refreshToken,
    } = row;
    return {
        userId,
        refreshToken
    };
};
