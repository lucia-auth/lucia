/// <reference types="lucia" />
declare namespace Lucia {
	type Auth = import("./lib/lucia.js").Auth;
	type DatabaseUserAttributes = {
		username: string;
	};
	type DatabaseSessionAttributes = {
		created_at: Date;
	};
}
