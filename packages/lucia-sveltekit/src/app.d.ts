/// <reference types="@sveltejs/kit" />
declare namespace App {
    interface Locals {
        lucia: import("./types.js").Session<any> | null;
    }
}
