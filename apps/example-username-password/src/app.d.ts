declare namespace App {
	interface Locals {
		lucia: import('lucia-sveltekit/types').Session<Lucia.UserData> | null;
	}
}

declare namespace Lucia {
	type UserData = { message: string };
}
