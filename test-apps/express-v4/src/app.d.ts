/// <reference types="lucia-auth" />
declare namespace Lucia {
	type Auth = import('./lucia.js').Auth;
	type UserAttributes = {
		username: string;
	};
}