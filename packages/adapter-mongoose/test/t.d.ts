/// <reference types="lucia-sveltekit" />
declare namespace Lucia {
    interface UserData {}
}

interface UserDoc {
    __v: any;
    _id: string;
    hashed_password: string | null;
    provider_id: string;
    username: string;
    email: string;
}

interface SessionDoc {
    _id: string;
    __v: any;
    access_token: string;
    expires: number;
    user_id: string;
}

interface RefreshTokenDoc {
    _id: string;
    __v: any;
    refresh_token: string;
    user_id: string;
}
