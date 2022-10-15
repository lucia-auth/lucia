import type {
    RefreshTokenSchema,
    SessionSchema,
    UserSchema,
} from "lucia-sveltekit/types";

export const convertUserRow = (row: UserRow): UserSchema => {
    const { id, hashed_password, provider_id, ...userData } = row;
    return {
        id,
        hashed_password,
        provider_id,
        ...userData,
    };
};

export const convertSessionRow = (row: SessionRow): SessionSchema => {
    const { id: _, access_token, user_id, expires } = row;
    return {
        access_token,
        user_id,
        expires,
    };
};

export const convertRefreshTokenRow = (
    row: RefreshTokenRow
): RefreshTokenSchema => {
    const { id: _, user_id, refresh_token } = row;
    return {
        user_id,
        refresh_token,
    };
};
