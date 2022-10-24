/// <reference types="lucia-sveltekit" />
declare namespace Lucia {
	type Auth = any;
	type UserAttributes = {};
}

declare namespace App {
	interface Locals {}
}

interface UserDoc {
	_id: string;
	__v?: any;
	_doc?: any;
	$__?: any;
	hashed_password: string | null;
	provider_id: string;
	username: string;
	user_email: string;
}

interface SessionDoc {
	_id: string;
	__v?: any;
	expires: number;
	user_id: string;
	idle_expires: number;
}
