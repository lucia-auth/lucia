import { auth } from '$lib/server/lucia';
import type { ServerLoadEvent } from '@sveltejs/kit';

export const load = auth.handleServerSession()