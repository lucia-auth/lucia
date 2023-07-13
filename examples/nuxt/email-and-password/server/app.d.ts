/// <reference types="lucia" />
declare namespace Lucia {
	type Auth = import("./utils/lucia").Auth;
	type DatabaseUserAttributes = {
		email: string;
		email_verified: number;
	};
	type DatabaseSessionAttributes = {};
}
