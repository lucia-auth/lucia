import { auth } from '$lib/server/lucia';
import { handleHooks } from '@lucia-auth/sveltekit';

export const handle = handleHooks(auth);
