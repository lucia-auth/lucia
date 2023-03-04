import { generateChecksum } from "./crypto.js";
import type { RequestEvent } from "./types.js";
import type { PageData } from "../types.js";

type LoadEvent = RequestEvent & {
	parent: any;
	depends: any;
};
type HandleServerSession = <
	LoadFn extends (event: any) => any = () => Promise<{}>
>(
	serverLoad?: LoadFn
) => (
	event: LoadEvent
) => Promise<Exclude<Awaited<ReturnType<LoadFn>>, void> & PageData>;

export const handleServerSession: HandleServerSession = (fn) => {
	const handleServerSessionCore = async ({
		locals
	}: RequestEvent): Promise<PageData> => {
		const { session, user } = await locals.validateUser();
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
	return async (event: LoadEvent) => {
		const { _lucia } = await handleServerSessionCore(event);
		const loadFunction = fn ?? (async () => {});
		const result = (await loadFunction(event)) || {};
		return {
			_lucia,
			...result
		} as Exclude<Awaited<ReturnType<typeof loadFunction>>, void> & PageData;
	};
};
