---
title: "Lucia 1.0"
description: "Announcing Lucia 1.0!"
date: "April 1st, 2022"
---

We are thrilled to announce Lucia v1.0!

Lucia is an server-side authentication library for TypeScript that aims to be unintrusive, straightforward, and flexible.

At its core, it's a library for managing users and sessions, providing the building blocks for setting up auth how you want. Database adapters allow Lucia to be used with any modern ORMs/databases and integration packages make it easy to implement things like OAuth.

Here's what working with Lucia looks like:

```ts
const user = await auth.createUser({
	// how to identify user for authentication?
	primaryKey: {
		providerId: "email", // using email
		providerUserId: "user@example.com", // email to use
		password: "123456"
	},
	// custom attributes
	attributes: {
		email: "user@example.com"
	}
});
const session = await auth.createSession(user.userId);
const sessionCookie = auth.createSessionCookie(session);
```

It started off as a small JWT-based library for SvelteKit made over summer break. Over the last few months, we switched to sessions, made it framework agnostic, added keys and OAuth support, and cleaned up the APIs. Even with all the breaking changes, it's still a huge passion project that provides a solution between a fully custom auth and something ready made.

Our core approach remained the same as well. Simple is better than easy. Things should be obvious and easy to understand. APIs should be applicable to a wide range of scenarios, even when a bit verbose. Making it easy to start usually lead to endless configuration and callbacks. We also believe documentation and learning resources are crucial to a library's success and have spent countless hours on it.