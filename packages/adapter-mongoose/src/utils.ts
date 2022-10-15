import type { RefreshTokenSchema, SessionSchema, UserSchema } from "lucia-sveltekit/types";

export const convertUserDoc = (row: UserDoc): UserSchema => {
    const {
        _id: id,
        __v: _,
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

export const convertSessionDoc = (row: SessionDoc): SessionSchema => {
    const {
        _id: _,
        __v: _v,
        access_token,
        user_id,
        expires,
    } = row;
    return {
        access_token,
        user_id,
        expires,
    };
};

export const convertRefreshTokenDoc = (
    row: RefreshTokenDoc
): RefreshTokenSchema => {
    const { _id, __v: _v, user_id, refresh_token } = row;
    return {
        user_id,
        refresh_token,
    };
};
