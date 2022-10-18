import { auth } from "$lib/server/lucia"
import { sequence } from "@sveltejs/kit/hooks"

export const handle =sequence(auth.handleHooks(), async ({event, resolve}) => {
    event.request.headers.set("Lucia-User", "hello")
    return await resolve(event)
})