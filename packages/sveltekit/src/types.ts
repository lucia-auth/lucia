import type { Session, User } from "lucia-auth";

export type LuciaContext = {
	user: User | null;
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
};
