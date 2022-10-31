import type { Session, User } from "lucia-auth";
import type { Readable } from "svelte/store";

export type RequestEvent = {
	request: Request;
	locals: {
		getSession: () => Session | null;
		setSession: (session: Session) => void;
		clearSession: () => void;
	};
	url: URL;
	cookies: {
		get: (name: string) => string | undefined;
		set: (name: string, value: string, options: any) => void;
		delete: any;
		serialize: any;
	};
	fetch: any;
	getClientAddress: any;
	params: any;
	platform: any;
	routeId: any;
	setHeaders: any;
};

export type GlobalWindow = Window & {
	_luciaStore?: Readable<LuciaContext>;
	_setLuciaStore?: (value: LuciaContext) => void;
	_luciaPageData?: {
		data: any;
	}[];
	_luciaHooksRanLast?: boolean;
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
