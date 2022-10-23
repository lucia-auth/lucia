import type { SessionSchema, UserSchema } from "lucia-sveltekit/types";

export const convertUserDoc = (row: UserDoc): UserSchema => {
    const {
        _id: id,
        __v: _,
        $__,
        _doc,
        hashed_password,
        provider_id,
        ...attributes
    } = row;
    return {
        id,
        hashed_password,
        provider_id,
        ...attributes,
    };
};

export const convertSessionDoc = (row: SessionDoc): SessionSchema => {
    const {
        _id: id,
        __v: _,
        user_id: userId,
        expires,
        idle_expires: idleExpires
    } = row;
    return {
        id,
        user_id: userId,
        expires,
        idle_expires: idleExpires
    };
};