export const handleServerSession = (auth, fn) => {
    const handleServerSessionCore = async ({ locals }) => {
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
        }
        catch {
            return {
                _lucia: null
            };
        }
    };
    return async (event) => {
        const { _lucia } = await handleServerSessionCore(event);
        const loadFunction = fn || (async () => { });
        const result = (await loadFunction(event)) || {};
        return {
            _lucia,
            ...result
        };
    };
};
