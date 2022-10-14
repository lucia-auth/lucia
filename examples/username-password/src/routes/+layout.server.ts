import { auth } from '$lib/server/lucia';

export const load = auth.handleServerSession()
