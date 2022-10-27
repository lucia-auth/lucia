import type { Session, User } from "lucia-auth";
import type { Readable } from "svelte/store";

export type LuciaContext = {
	user: Readable<User | null>;
};

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
	};
	fetch: any;
	getClientAddress: any;
	params: any;
	platform: any;
};

export type GlobalWindow = Window & {
	_lucia?: User | null;
	_luciaPageData?: {
		data: any;
	}[];
};