import type { Session, User } from "lucia-auth";

export type Validate = () => Promise<Session | null>;
export type ValidateUser = () => Promise<
	{ session: Session; user: User } | { session: null; user: null }
>;
export type SetSession = (session: Session | null) => void;

export type RequestEvent = {
	request: Request;
	locals: {
		validate: Validate;
		validateUser: ValidateUser;
		setSession: SetSession;
	} & App.Locals;
	url: URL;
	cookies: {
		get: (name: string) => string | undefined;
		set: (name: string, value: string, options: any) => void;
		delete: any;
		serialize: any;
		[k: string | number | symbol]: any;
	};
	fetch: any;
	getClientAddress: any;
	platform: any;
	params: any;
	route: any;
	setHeaders: any;
	isDataRequest: any;
};
