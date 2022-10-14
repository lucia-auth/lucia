export interface UserRow {
    id: string;
    provider_id: string;
    hashed_password: string | null;
    username: string;
    user_email: string;
}

export interface RefreshTokenRow {
    refresh_token: string;
    user_id: string;
}

export interface SessionRow {
    access_token: string;
    expires: number;
    user_id: string;
}