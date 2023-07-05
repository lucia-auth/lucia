/// <reference types="astro/client" />
declare namespace App {
	interface Locals {
		auth: import("lucia").AuthRequest;
	}
}

/// <reference types="lucia" />
declare namespace Lucia {
	type Auth = import("./lib/lucia").Auth;
	type DatabaseUserAttributes = {
		username: string;
	};
	type DatabaseSessionAttributes = {};
}
