/// <reference types="lucia" />
declare namespace Lucia {
	type Auth = any;
	type DatabaseUserAttributes = {};
	type DatabaseSessionAttributes = {};
}

// fix weird unstorage type errors
type R2Bucket = any;
type KVNamespace = any;
