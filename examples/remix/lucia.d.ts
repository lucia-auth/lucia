/// <reference types="lucia" />
declare namespace Lucia {
	type Auth = import("@auth/lucia.server.js").Auth;
	type DatabaseUserAttributes = {
		username: string;
	};
	type DatabaseSessionAttributes = {
		created_at: Date;
	};
}
