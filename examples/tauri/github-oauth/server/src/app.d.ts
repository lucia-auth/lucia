/// <reference types="lucia" />
declare namespace Lucia {
	type Auth = import("./auth").Auth;
	type DatabaseUserAttributes = {
		username: string;
	};
	type DatabaseSessionAttributes = {};
}
