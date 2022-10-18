/// <reference types="lucia-sveltekit" />
declare namespace Lucia {

}

/// <reference types="@sveltejs/kit" />
declare namespace App {
    interface Locals {
        getSession: () => import("lucia-sveltekit/types").Session | null
    }
}
