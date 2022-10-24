/// <reference types="lucia-sveltekit" />
declare namespace Lucia {
	type Auth = any;
	type UserAttributes = {
		username: string;
	};
}

declare namespace App {
	interface Locals {}
}
