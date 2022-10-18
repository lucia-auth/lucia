declare namespace Lucia {
    export interface UserAttributesSchema {} 
    export interface User {}
}

/// <reference types="@sveltejs/kit" />
declare namespace App {
	export interface Locals {
        getSession: () => import("./types.js").Session | null
    }
}
