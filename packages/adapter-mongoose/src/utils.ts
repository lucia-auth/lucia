import type { UserSchema } from "lucia-sveltekit/types";
import mongoose from "mongoose";

export const convertUserDoc = (row: UserDoc): UserSchema => {
    const {
        _id: id,
        __v: _,
        hashed_password: hashedPassword,
        provider_id: providerId,
        ...userData
    } = row;
    return {
        id,
        hashedPassword,
        providerId,
        ...userData,
    };
};

export const convertSessionDoc = (row: SessionDoc) => {
    const {
        _id,
        __v: _v,
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

export const convertRefreshTokenDoc = (
    row: RefreshTokenDoc
): {
    refreshToken: string;
    userId: string;
} => {
    const { _id, __v: _v, user_id: userId, refresh_token: refreshToken } = row;
    return {
        userId,
        refreshToken,
    };
};
