declare namespace App {
	interface Locals {
		lucia: import('lucia-sveltekit/types').Session | null;
	}
}

declare namespace Lucia {
	type UserData = { username: string };
}
