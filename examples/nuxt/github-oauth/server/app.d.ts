/// <reference types="lucia" />
declare namespace Lucia {
	type Auth = import("./utils/lucia").Auth;
	type DatabaseUserAttributes = {
		github_username: string;
	};
	type DatabaseSessionAttributes = {};
}
