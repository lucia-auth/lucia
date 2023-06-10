/// <reference types="lucia" />
declare namespace Lucia {
	type Auth = import("./utils/auth.js").Auth;
	type DatabaseUserAttributes = {
		username: string;
	};
	type DatabaseSessionAttributes = {
		created_at: Date;
	};
}
