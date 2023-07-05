---
title: "Introduction"
---

At its most basic, Lucia lets you create users and validate sessions in a few lines of code. But what makes it truly great is that it also takes care of database queries. Just set up a simple user and session table, and pick one of the many database adapters to start using Lucia. It doesn't try to do everything, and that's what makes it easy to understand and use.

It's also built to support all modern frameworks and runtimes. Of course, they all interact with requests and responses differently, so we provide minimal framework and runtime specific APIs to bridge the gap.

```ts
const user = await auth.createUser({
	// user identified using their email
	key: {
		providerId: "email",
		providerUserId: email,
		password
	},
	// custom attributes
	attributes: {
		email,
		username
	}
});
const session = await auth.createSession({
	userId: user.userId,
	attributes: {} // custom attributes
});
const sessionCookie = auth.createSessionCookie(session);
```

Make sure you're comfortable working with your database and framework, and have a basic understanding of servers/HTTP. If you're new to backend development or just looking for a quick and easy authentication solution, you might want to look for another option.

If you have any questions, feel free to ask them in our [Discord server](https://discord.gg/PwrK3kpVR3)!

> The name _Lucia_ is based on the country of Saint Lucia, so technically it's pronounced _loo-shya_. But based on a community poll, most people pronounce it _lu-si-a_. _loo-shya_, _lu-si-a_, _lu-chi-a_ your choice!
