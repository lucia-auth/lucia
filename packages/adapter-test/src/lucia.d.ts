/// <reference types="lucia" />
declare namespace Lucia {
	type Auth = any;
	type DatabaseUserAttributes = {
		username: string;
	};
	type DatabaseSessionAttributes = {
		country: string;
	};
}
