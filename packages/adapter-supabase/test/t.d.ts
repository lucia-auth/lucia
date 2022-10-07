interface UserRow {
    id: string;
    hashed_password: string | null;
    provider_id: string;
    username: string;
    user_email: string;
}

interface SessionRow {
    id: number;
    access_token: string;
    expires: number;
    user_id: string;
}

interface RefreshTokenRow {
    id: number;
    refresh_token: string;
    user_id: string;
}
