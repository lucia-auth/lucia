import { auth } from "$lib/server/lucia"

export const handle = auth.handleAuth
export const getSession = auth.getAuthSession