---
order: 0
layout: "@layouts/DocumentLayout.astro"
title: "Introduction"
---

Lucia is an authentication library that, at its core, makes managing users and sessions easier. It doesn't attempt to do anything more than that. It's not an out-of-the-box library like NextAuth, nor an auth provider like Firebase, and that is a super important distinction. You will need to bring your own database and things like OAuth and magic links have to be made by yourself. However, once you understand the basics of Lucia and authentication, it allows you to fully control and customize your authentication.

Working with Lucia looks something like this. In the code below, you're creating a new user with a user/password method, creating a new session, and saving the session inside cookies.

```ts
const user = await auth.createUser("email", email, {
	password
});
const session = await auth.createSession(user.userId);
locals.setSession(session);
```
