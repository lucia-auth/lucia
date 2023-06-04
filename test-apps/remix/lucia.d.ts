/// <reference types="lucia" />
declare namespace Lucia {
	type Auth = import("@auth/lucia.server.js").Auth;
	type UserAttributes = {
		username: string;
	};
}
