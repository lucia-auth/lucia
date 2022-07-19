export interface Adapter {
    getUserFromRefreshToken: (
        refreshToken: string
    ) => Promise<DatabaseUser | null>;
    getUserFromIdentifierToken: (
        identifierToken: string
    ) => Promise<DatabaseUser | null>;
    createUser: (
        userId: string,
        data: {
            identifier_token: string;
            hashed_password: string | null;
            user_data: Record<string, any>;
        }
    ) => Promise<void>;
    deleteUser: (userId: string) => Promise<void>;
    saveRefreshToken: (refreshToken: string, userId: string) => Promise<void>;
    deleteRefreshToken: (refreshToken: string) => Promise<void>;
    deleteUserRefreshTokens: (userId: string) => Promise<void>;
}

export interface LuciaUser {
    user_id: string;
    [key: string]: any;
}

export interface LuciaSession {
    hashed_fingerprint: string;
    iat: number;
    exp: number;
}

export interface DatabaseUser {
    id: string;
    hashed_password: string;
    identifier_token: string;
    [key: string]: any;
}

export type LuciaSvelteKitSession = {
    user: LuciaUser;
    access_token: string;
    refresh_token: string;
} | null;
