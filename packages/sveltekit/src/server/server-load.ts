import type { User, Auth } from "lucia-auth";
import type { PageData, RequestEvent } from "../types.js";
import { generateChecksum } from "./crypto.js";

type HandleServerSession = <
	A extends Auth,
	LoadFn extends (event: RequestEvent) => any = () => Promise<any>
>(
	auth: A,
	serverLoad?: LoadFn
) => (event: RequestEvent) => Promise<Exclude<Awaited<ReturnType<LoadFn>>, void> & PageData>;

export const handleServerSession: HandleServerSession = (auth: Auth, fn?) => {
	const handleServerSessionCore = async ({ locals }: RequestEvent): Promise<PageData> => {
		const session = locals.getSession();
		try {
			if (!session) throw new Error();
			const user = await auth.getUser(session.userId);
			return {
				_lucia: {
					user,
					sessionChecksum: generateChecksum(session.sessionId)
				}
			};
		} catch {
			return {
				_lucia: {
					user: null,
					sessionChecksum: null
				}
			};
		}
	};
	return async (event: RequestEvent) => {
		const { _lucia } = await handleServerSessionCore(event);
		const loadFunction = fn || (async () => {});
		const result = (await loadFunction(event)) || {};
		return {
			_lucia,
			...result
		} as Exclude<Awaited<ReturnType<typeof loadFunction>>, void> & PageData;
	};
};
