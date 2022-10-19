import { auth } from '$lib/server/lucia';
import type { LayoutServerLoad } from './$types.js';

export const load: LayoutServerLoad = auth.handleServerSession();
