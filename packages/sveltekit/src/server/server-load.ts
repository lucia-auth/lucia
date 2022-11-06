import { generateChecksum } from "./crypto.js";
import type { PageData, RequestEvent } from "../types.js";

type HandleServerSession = <
	LoadFn extends (event: RequestEvent) => any = () => Promise<any>
>(
	serverLoad?: LoadFn
) => (event: RequestEvent) => Promise<Exclude<Awaited<ReturnType<LoadFn>>, void> & PageData>;

export const handleServerSession: HandleServerSession = (fn) => {
	const handleServerSessionCore = async ({ locals }: RequestEvent): Promise<PageData> => {
		const { session, user } = await locals.getSessionUser();
		if (session) {
			return {
				_lucia: {
					user,
					sessionChecksum: generateChecksum(session.sessionId)
				}
			};
		}
		return {
			_lucia: {
				user: null,
				sessionChecksum: null
			}
		};
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
