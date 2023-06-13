---
order: 0
title: "Introduction"
description: "A quick introduction to Lucia"
---

Lucia is a server side library that provides basic primitives for handling session and user. Simply put, it creates and validates sessions. What makes it truly great is that it also handles database queries. Just setup a basic user and session table, and all you need to do is to use one of the many database adapters to initialize Lucia. It doesn't try to be an all-in-one solution, and that focused scope makes it easy to understand and use.

Furthermore, it's built to support all modern frameworks and runtimes. Of course, they all interact with requests and responses differently, so we provide minimal framework and runtime specific APIs to bridge the gap. 

*If you just need a zero-effort solution, Lucia might not be for you.* Keep in mind that you still need setup your endpoints and client side code.

```ts
const user = await auth.createUser({
	key: {
		providerId: "email",
		providerUserId: email,
		password
	},
	attributes: {
		email,
		username
	}
});
const session = await auth.createSession(user.userId);
const sessionCookie = auth.createSessionCookie(session);
```

If you have any questions, feel free to ask them in our [Discord server](https://discord.gg/PwrK3kpVR3)!

> The name _Lucia_ is based on the country of Saint Lucia, so technically it's pronounced _loo-shya_. But based on a community poll, most people pronounce it _lu-si-a_. _loo-shya_, _lu-si-a_, _lu-chi-a_ your choice!