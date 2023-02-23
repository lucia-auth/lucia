import type { User } from "lucia-auth";

export type PageData = {
	_lucia?: LuciaContext;
};

/*
session checksum is a hash of the session id
this hash can be used to check if the session id has changed
without exposing the session id

uses md5, which has a collision weakness
but is good enough for non-password hashing use case
*/
export type LuciaContext =
	| {
			user: Readonly<User>;
			sessionChecksum: string;
	  }
	| {
			user: null;
			sessionChecksum: null;
	  };
