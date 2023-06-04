/// <reference types="lucia" />
declare namespace Lucia {
	export type UserAttributes = {
		username?: string;
	};
	export type Auth = import("lucia").Auth;
}
