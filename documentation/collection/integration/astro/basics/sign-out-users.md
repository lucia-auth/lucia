---
_order: 1
title: "Sign out users"
---

An endpoint that handles log out should be created and a sign out request should be sent using forms.

## Handle Request

Sign out requests should be handled by POST. **Make sure to invalidate the current session** and delete the cookie by setting the current session to `null`.

```ts
import { AuthRequest } from "@lucia-auth/astro";
import { auth } from "../lucia";
import type { APIRoute } from "astro";

export const post: APIRoute = async (Astro) => {
	// authenticate user
	const authRequest = new AuthRequest(auth, Astro);
	const session = await authRequest.validate();
	if (!session)
		return new Response(null, {
			status: 400
		});

	await auth.invalidateSession(session.sessionId); // invalidate current session
	authRequest.setSession(null); // delete cookie

	// redirect to login page
};
```

## Submit request

Create a new form that sends a POST request to the endpoint. Authenticated users will be signed out on submission.

```html
<form action="/api/logout" method="post">
	<input type="submit" value="Sign out" />
</form>
```
