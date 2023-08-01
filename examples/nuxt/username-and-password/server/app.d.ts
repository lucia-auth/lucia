/// <reference types="lucia" />
declare namespace Lucia {
	type Auth = import("./utils/lucia").Auth;
	type DatabaseUserAttributes = {
		username: string;
	};
	type DatabaseSessionAttributes = {};
}
