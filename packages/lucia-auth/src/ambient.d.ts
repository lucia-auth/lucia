declare namespace Lucia {
	export type UserAttributes = {};
	export class Auth extends (await import("./auth/index.js")).Auth {}
}
