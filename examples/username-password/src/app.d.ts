/// <reference types="lucia-auth" />
declare namespace Lucia {
	type Auth = import('$lib/server/lucia.js').Auth;
	type UserAttributes = {
		username: string;
	};
}

/// <reference types="@sveltejs/kit" />
declare namespace App {
	interface Locals {
		getSession: import('lucia-auth/types').GetSession;
		setSession: import('lucia-auth/types').SetSession;
		clearSession: import('lucia-auth/types').ClearSession;
	}
}
