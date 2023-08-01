/// <reference types="lucia" />
declare namespace Lucia {
	type Auth = import("@/auth/lucia").Auth;
	type DatabaseUserAttributes = {
		email: string;
	};
	type DatabaseSessionAttributes = {};
}
