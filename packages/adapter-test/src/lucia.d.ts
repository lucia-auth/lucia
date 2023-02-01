/// <reference types="lucia-auth" />
declare namespace Lucia {
	type Auth = any;
	type UserAttributes = {
		username: string;
	};
}

declare namespace App {
	interface Locals {}
}
