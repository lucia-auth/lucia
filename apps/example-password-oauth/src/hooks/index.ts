import { auth } from "$lib/lucia"

export const handle = auth.handleAuth
export const getSession = auth.getAuthSession