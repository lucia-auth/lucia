import { handleServerSession } from '@lucia-auth/sveltekit';

export const load = handleServerSession();
