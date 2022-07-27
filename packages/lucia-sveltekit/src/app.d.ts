/// <reference types="@sveltejs/kit" />
declare namespace App {
    interface Locals {
        lucia: import("./types.js").SvelteKitSession<any> | null;
    }
    interface Session {
        lucia: import("./types.js").SvelteKitSession<any> | null;
    }
}
