/// <reference types="@sveltejs/kit" />
declare namespace App {
    interface Locals {
        lucia: {
            access_token: string
            refresh_token: string
            fingerprint_token: string
        } | null
    }
}
