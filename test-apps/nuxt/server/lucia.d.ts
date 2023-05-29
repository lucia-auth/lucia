/// <reference types="lucia-auth" />
declare namespace Lucia {
	type Auth = import("./utils/auth.js").Auth;
	type UserAttributes = {
		username: string;
	};
}

// https://github.com/nuxt/nuxt/issues/21074
declare namespace NodeJS {
	interface Process {
		dev: any;
	}
}
