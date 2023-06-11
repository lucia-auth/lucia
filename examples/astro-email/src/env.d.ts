/// <reference types="astro/client" />
declare namespace App {
	interface Locals {
		auth: import("lucia").AuthRequest;
		isValidFormSubmission: () => boolean
	}
}

/// <reference types="lucia" />
declare namespace Lucia {
	type Auth = import("@auth/lucia").Auth;
	type DatabaseUserAttributes = {
		email: string;
		email_verified: boolean
	};
	type DatabaseSessionAttributes = {};
}
