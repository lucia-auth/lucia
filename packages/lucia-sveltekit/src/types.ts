export interface Adapter {
    getUserFromRefreshToken: (
        refreshToken: string
    ) => Promise<DatabaseUser<Record<string, any>> | null>;
    getUserFromIdentifierToken: (
        identifierToken: string
    ) => Promise<DatabaseUser<Record<string, any>> | null>;
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

export type User<UserData extends {}> = UserData & {
    user_id: string;
};

export interface Session {
    fingerprint_hash: string;
    iat: number;
    exp: number;
}

export type DatabaseUser<UserData> = {
    id: string;
    hashed_password: string | null;
    identifier_token: string;
} & UserData;

export type SvelteKitSession<UserData extends {}> = {
    user: User<UserData>;
    access_token: string;
    refresh_token: string;
} | null;

export type Env = "DEV" | "PROD";
