/// <reference types="lucia" />
declare namespace Lucia {
	type Auth = import("./auth/lucia").Auth;
	type DatabaseUserAttributes = {
		github_username: string;
	};
	type DatabaseSessionAttributes = {};
}
