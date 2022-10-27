import { auth } from '$lib/server/lucia';
import { handleHooks } from '@lucia-auth/sveltekit';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = handleHooks(auth);
