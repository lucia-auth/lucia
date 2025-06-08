---
title: "Sessions"
---

# Sessions

HTTP is by design a stateless protocol. The server doesn't know if 2 requests came from the same client.

Browsers offer client-side storage cookies and local storage but you can't trust anything sent by the client. If you identify users with a "user" cookie, how do you stop users from editing the value and impersonating other users? How do you keep all that state in the server?

This is where sessions come in. Whenever you want to start persisting state across requests, for example a "signed in" state, you create a session. Requests associated with a session share the same state, for example the current authenticated users. To allow clients to associate a request with a session, you can issue session tokens. Assuming that token is unguessable, you can assume requests with the token are linked to that particular session.

Learn how to implement a basic session securely by reading the [Basic session implementation](/sessions/basic) page. We also recommend looking at the [Inactivity timeout](/sessions/inactivity-timeout) page if you plan to use sessions for user authentication.
