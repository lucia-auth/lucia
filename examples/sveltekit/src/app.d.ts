/// <reference types="lucia" />
declare namespace Lucia {
	type Auth = import('$lib/server/lucia.js').Auth;
	type DatabaseUserAttributes = {
		username: string;
	};
	type DatabaseSessionAttributes = {
		created_at: Date;
	};
}

/// <reference types="@sveltejs/kit" />
declare namespace App {
	interface Locals {
		auth: import('lucia').AuthRequest;
	}
}
