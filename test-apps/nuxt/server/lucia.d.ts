/// <reference types="lucia-auth" />
declare namespace Lucia {
	type Auth = import("./utils/auth.js").Auth;
	type UserAttributes = {
		username: string;
	};
}

declare namespace NodeJS {
	interface Process {
		dev: any;
	}
}
