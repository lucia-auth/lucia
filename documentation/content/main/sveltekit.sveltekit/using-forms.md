---
_order: 5
title: "Using forms"
---

Forms can return 3 types of response

- Success
- Redirect
- Error

When using `use:enhance` action, SvelteKit will handle them accordingly:

- Success: Call [`invalidateAll()`](https://kit.svelte.dev/docs/modules#$app-navigation-invalidateall) to re-run load functions
- Redirect: Call [`goto()`](https://kit.svelte.dev/docs/modules#$app-navigation-goto)
- Error: Go to the nearest error boundary

For the session to update in the client, [`handleServerSession()`](/sveltekit/api-reference/server-api#handleserversession) load function must re-run. This means, when using the default behavior, for a session to update post-form submission, it has to receive a successful response and not a redirect response. This has to be kept on mind when using forms to handle sign ins and account creation.

```ts
export const actions: Actions = {
	default: async () => {
		// stuff
		// do NOT use redirect() with the default use:action behavior
	}
};
```

All that being said, you can configure the default behavior of SvelteKit so it calls `invalidateAll()` on redirects, though it may not be necessary if you have a load function that redirects users based on their auth state.
