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
	_userStore?: Readable<User | null>;
	_setUserStore?: (user: User | null) => void;
	_luciaPageData?: {
		data: any;
	}[];
};
