/// <reference types="lucia" />
declare namespace Lucia {
	type Auth = import("./lucia.js").Auth;
	type DatabaseUserAttributes = {
		email: string;
		email_verified: number;
	};
	type DatabaseSessionAttributes = {};
}
