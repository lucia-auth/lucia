/// <reference types="lucia-sveltekit" />
declare namespace Lucia {
    type Auth = any;
    type UserAttributesSchema = {
        username: string
    };
}

declare namespace App {
    interface Locals {}
}
