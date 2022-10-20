/// <reference types="lucia-sveltekit" />
declare namespace Lucia {
	type Auth = import('$lib/server/lucia.js').Auth;
	type UserAttributes = {
		username: string;
	};
}

/// <reference types="@sveltejs/kit" />
declare namespace App {
	interface Locals {
		getSession: import('lucia-sveltekit/types').GetSession;
		setSession: import('lucia-sveltekit/types').SetSession;
		clearSession: import('lucia-sveltekit/types').ClearSession;
	}
}
