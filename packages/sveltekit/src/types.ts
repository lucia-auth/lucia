import type { Session, User } from "lucia-auth";
import type { Readable } from "svelte/store";

export type RequestEvent = {
	request: Request;
	locals: {
		validate: () => Promise<Session | null>;
		validateUser: () => Promise<{ session: Session; user: User } | { session: null; user: null }>;
		setSession: (session: Session | null) => void;
	};
	url: URL;
	cookies: {
		get: (name: string) => string | undefined;
		set: (name: string, value: string, options: any) => void;
		delete: any;
		serialize: any;
	};
};

export type GlobalWindow = Window & {
	_luciaStore?: Readable<LuciaContext>;
	_setLuciaStore?: (value: LuciaContext) => void;
	_luciaPageData?: ({
		type: "data";
		data: Record<any, any>;
		uses: Record<any, any>;
	} | null)[];
};

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
