import { handleServerSession } from '@lucia-auth/sveltekit';
import type { LayoutServerLoad } from './$types.js';

export const load: LayoutServerLoad = handleServerSession();
