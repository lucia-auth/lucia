---
order: 0
layout: "@layouts/DocumentLayout.astro"
title: "Introduction"
---

Lucia is an authentication library that, at its core, makes managing users and sessions easier. It doesn't attempt to do anything more than that. It's not a out-of-the-box library like NextAuth, nor an auth provider like Firebase, and that is a super important distinction. You will need to bring your own database and things like OAuth and magic links have to be made by yourself. However, once you understand the basics of Lucia and authentication, it allows you to fully control and customize your authentication.

Working with Lucia looks something like this. In the code below, you're creating a new user with a user/password method, creating a new session, and saving the tokens inside cookies.

```ts
const user = await auth.createUser("email", email, {
    password,
});
const { tokens } = await auth.createSession(user.userId);
setCookie(cookie, ...tokens.cookies);
```

Since understanding the concepts of the library is crucial to fully utilizing it (and of course making it secure), we recommend reading the section below before diving in.

## Understanding Lucia

Once a user signs in, an access token and a refresh token is issued. The access token can be used to identify the user and is valid for the duration of the session (8 hours). Once the access token expires, the refresh token can be exchange for a new access token, thus creating a new session. Both of these tokens are stored as http-only cookies and can only be read from the server. Lucia will only considered cookies valid if the request is coming from a trusted domain.

Users can be identified using either of 2 attributes. First is the user id, and the other is the provider id. Provider id is the combination of the provider name (the authentication method used), and an identifier (something unique to that user within the authentication method). Both of these are defined by you when creating the user and can be used when verifying the user's credentials. For example, the provider name may be `email` and the identifier may be the user's email when using email/password authentication. This allows Lucia to handle multiple authentication methods while having a single table for your users.

The current session and the user can be accessed both in the server and in the client. However, for the session to update in the client, like after sign ins/outs or user update, the page has to be fully refreshed.