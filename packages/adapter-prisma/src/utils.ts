import type { UserSchema } from "lucia-sveltekit/types";
import { convertSnakeCaseKeysToCamelCase } from "lucia-sveltekit/adapter";
import { RefreshToken, Session, User } from "@prisma/client";

export const convertUserRow = (row: User): UserSchema => {
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
        ...convertSnakeCaseKeysToCamelCase(userData),
    };
};

export const convertSessionRow = (row: Session) => {
    const { id: _, access_token: accessToken, user_id: userId, expires } = row;
    return {
        accessToken,
        userId,
        expires: Number(expires),
    };
};

export const convertRefreshTokenRow = (
    row: RefreshToken
): {
    refreshToken: string;
    userId: string;
} => {
    const { id: _, user_id: userId, refresh_token: refreshToken } = row;
    return {
        userId,
        refreshToken,
    };
};
