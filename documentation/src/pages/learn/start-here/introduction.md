---
order: 0
layout: "@layouts/DocumentLayout.astro"
title: "Introduction"
---

Lucia is a library that, at its core, makes managing users and sessions easy, and it doesn't attempt to do anything more than that. It's not an out-of-the-box library like NextAuth, nor an auth platform like Firebase, and that is a super important distinction. You will need to use your own database and strategies like OAuth and magic links have to be made by yourself. However, once you understand the basics of Lucia and authentication, it allows you to fully control and customize your authentication.

Working with Lucia looks something like this. In the code below, you're creating a new user with a email/password method, creating a new session, and creating a cookie that you can set it to the user.

```ts
const user = await auth.createUser("email", email, {
	password
});
const session = await auth.createSession(user.userId);
const sessionCookie = auth.createSessionCookie(session)
```

Lucia aims to work well with any modern web frameworks and supports run-times such as Cloudflare edge workers.
