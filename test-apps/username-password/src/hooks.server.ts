import { auth, sessionInstance, userSessionInstance } from '$lib/server/lucia';

sessionInstance.connect()
userSessionInstance.connect()

export const handle = auth.handleHooks();