/// <reference types="@sveltejs/kit" />
declare namespace App {
    interface Locals {
        lucia: {
            user: import("./types.js").User;
            access_token: string;
            refresh_token: string;
        } | null;
    }
    interface Session {
        lucia: {
            user: import("./types.js").User;
            access_token: string;
            refresh_token: string;
        } | null;
    }
}
