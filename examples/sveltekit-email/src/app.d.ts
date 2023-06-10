// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		interface Locals {
			auth: import('lucia').AuthRequest;
		}
	}
}

/// <reference types="lucia" />
declare global {
	namespace Lucia {
		type Auth = import('$lib/lucia').Auth;
		type UserAttributes = Omit<import('@prisma/client').AuthUser, 'id'>;
	}
}

export {};
