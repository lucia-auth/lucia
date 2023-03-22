/// <reference types="lucia-auth" />
declare namespace Lucia {
	export type UserAttributes = {
		username?: string;
	};
	export type Auth = {
		transformUserData: () => {
			userId: string;
		};
	};
}
