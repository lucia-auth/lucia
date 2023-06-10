declare namespace Lucia {
	export type DatabaseUserAttributes = {};
	export type DatabaseSessionAttributes = {};
	export class Auth extends (await import("./auth/index.js")).Auth {}
}
