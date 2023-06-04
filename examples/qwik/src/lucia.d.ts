/// <reference types="lucia" />
declare namespace Lucia {
	type Auth = import("./lib/lucia.js").Auth;
	type UserAttributes = {
		username: string;
	};
}
