import type { Context } from "./index.js";
import type { ServerLoad, ServerLoadEvent } from "../kit.js";
import { User } from "../types.js";

type HandleServerSession = <LoadFn extends ServerLoad = () => Promise<{}>>(
    serverLoad?: LoadFn
) => (
    event: ServerLoadEvent
) => Promise<Exclude<Awaited<ReturnType<LoadFn>>, void> & { _lucia: User }>;

export const handleServerSessionFunction = (context: Context) => {
    const handleServerSessionCore = async ({
        locals,
    }: ServerLoadEvent): Promise<{ _lucia: User | null }> => {
        const session = locals.getSession();
        if (!session)
            return {
                _lucia: null,
            };
        try {
            const user = await context.auth.getUser(session.userId);
            return {
                _lucia: user,
            };
        } catch {
            return {
                _lucia: null,
            };
        }
    };
    const handleServerSession: HandleServerSession = (fn?) => {
        return async (event: ServerLoadEvent) => {
            const { _lucia } = await handleServerSessionCore(event);
            const loadFunction = fn || (async () => {});
            const result = (await loadFunction(event)) || {};
            return {
                _lucia,
                ...result,
            } as Exclude<Awaited<ReturnType<typeof loadFunction>>, void> & {
                _lucia: User;
            };
        };
    };
    return handleServerSession;
};
