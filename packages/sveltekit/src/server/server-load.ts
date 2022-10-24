import type { User, Auth } from "lucia-auth";
import type { RequestEvent } from "../types.js";

type HandleServerSession = <
	A extends Auth,
	LoadFn extends (event: RequestEvent) => any = () => Promise<any>
>(
	auth: A,
	serverLoad?: LoadFn
) => (
	event: RequestEvent
) => Promise<Exclude<Awaited<ReturnType<LoadFn>>, void> & { _lucia: User }>;

export const handleServerSession: HandleServerSession = (auth: Auth, fn?) => {
	const handleServerSessionCore = async ({
		locals
	}: RequestEvent): Promise<{ _lucia: User | null }> => {
		const session = locals.getSession();
		if (!session)
			return {
				_lucia: null
			};
		try {
			const user = await auth.getUser(session.userId);
			return {
				_lucia: user
			};
		} catch {
			return {
				_lucia: null
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
		} as Exclude<Awaited<ReturnType<typeof loadFunction>>, void> & {
			_lucia: User;
		};
	};
};
