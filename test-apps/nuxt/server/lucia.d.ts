/// <reference types="lucia" />
declare namespace Lucia {
	type Auth = import("./utils/auth.js").Auth;
	type UserAttributes = {
		username: string;
	};
}
