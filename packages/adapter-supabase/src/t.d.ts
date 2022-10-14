/// <reference types="lucia-sveltekit" />
declare namespace Lucia {
	interface UserData {}
}

declare namespace App {
	interface Locals {}
}

interface UserRow {
    id: string;
    hashed_password: string | null;
    provider_id: string;
    [user_data: string]: any;
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