---
_order: 0
title: "Introduction"
---

Lucia is a library that, at its core, makes managing users and sessions easy, and it doesn't attempt to do anything more than that. Here's a quick overview of what it does provides:

- A core library to manage users and validate sessions
- Database adapters that connects Lucia to your database or ORM of choice, like Prisma and Mongoose
- Integration for popular frameworks like SvelteKit and Next.js
- Packages that handles API calls with external providers for auth strategies like OAuth

It's not an plug n' play library like NextAuth, nor an auth platform like Firebase, and that is a key distinction. Lucia provides the APIs for handling authentication, but how you use them is up to you. You'll have to design the basic auth flow, and implement UI components and request handler for that.

Working with it looks something like this. In the code below, you're creating a new user with a email/password method, creating a new session, and creating a cookie that you set to the user.

```ts
const user = await auth.createUser("email", email, {
	password
});
const session = await auth.createSession(user.userId);
const sessionCookie = auth.createSessionCookie(session);
```

Lucia aims to work well with any modern web frameworks and supports run-times other than Node such as Cloudflare edge workers.
