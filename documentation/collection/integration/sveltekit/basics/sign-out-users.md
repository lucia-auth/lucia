---
_order: 4
title: "Sign out users"
---

An action that handles log out should be created and a sign out request should be sent using forms. It can alternatively be an API endpoint.

## Handle Request

Sign out requests should be handled by POST. **Make sure to invalidate the current session** and delete the cookie by setting the current session to `null`.

```ts
import { type Actions, fail } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { auth } from "$lib/server/lucia";

export const actions: Actions = {
	default: async ({ locals }) => {
		const session = await locals.validate();
		if (!session) return fail(401);
		await auth.invalidateSession(session.sessionId); // invalidate session
		locals.setSession(null); // remove cookie
	}
};
```

## Submit request

Instead of a sign out button, add a form. Authenticated users will be signed out on a successful submission.

```svelte
<script lang="ts">
	import { enhance } from "$app/forms";
</script>

<form use:enhance method="post">
	<input type="submit" class="button" value="Sign out" />
</form>
```
