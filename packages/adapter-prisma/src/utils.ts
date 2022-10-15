import type { RefreshTokenSchema, SessionSchema, UserSchema } from "lucia-sveltekit/types";
import { RefreshToken, Session, User } from "@prisma/client";

export const convertUserRow = (row: User): UserSchema => {
    const {
        id,
        hashed_password,
        provider_id,
        ...userData
    } = row;
    return {
        id,
        hashed_password,
        provider_id,
        ...userData,
    };
};

export const convertSessionRow = (row: Session): SessionSchema => {
    const { id: _, access_token, user_id, expires } = row;
    return {
        access_token,
        user_id,
        expires: Number(expires),
    };
};

export const convertRefreshTokenRow = (
    row: RefreshToken
): RefreshTokenSchema => {
    const { id: _, user_id, refresh_token } = row;
    return {
        user_id,
        refresh_token,
    };
};
