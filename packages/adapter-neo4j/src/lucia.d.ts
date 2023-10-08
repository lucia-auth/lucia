/// <reference types="lucia" />

declare namespace Lucia {
	type Auth = any; // Types doesn't work when any
	type DatabaseUserAttributes = {}; // Types doesn't work when any
	type DatabaseSessionAttributes = {}; // Types doesn't work when any
}
