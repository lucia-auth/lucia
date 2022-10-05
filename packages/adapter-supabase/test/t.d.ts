
interface UserRow {
    id: string;
    hashed_password: string;
    provider_id: string;
    username: string,
    email: string
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