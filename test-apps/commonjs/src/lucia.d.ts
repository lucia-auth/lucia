/// <reference types="lucia-auth" />
declare namespace Lucia {
	type Auth = import("./lucia").Auth;
	type UserAttributes = {
		username: string;
	};
}
