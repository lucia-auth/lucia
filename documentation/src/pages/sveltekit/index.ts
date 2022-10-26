import type { APIRoute } from "astro";

export const get: APIRoute = async () => {
    return new Response(null, {
        status: 302,
        headers: {
            location: "/sveltekit/start-here/getting-started"
        }
    })
}