declare namespace Lucia {
    export type UserAttributes = {};
    export class Auth extends (await import("./auth/index.js")).Auth {}
}

/// <reference types="@sveltejs/kit" />
declare namespace App {
    export interface Locals {
        getSession: () => import("./types.js").Session | null;
        setSession: (session: import("./types.js").Session) => void;
        clearSession: () => void;
    }
}
