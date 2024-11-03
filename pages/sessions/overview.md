---
title: "Sessions"
---

# Sessions

Sessions are a way to persist state in the server. It is especially useful for managing the authentication state, such as the client's identity. We can assign each session with a unique ID and store it on the server to use it as a token. The client can then associate subsequent requests with a session, and by extension the user, by sending its ID.

Session IDs can either be stored using cookies or local storage in browsers. We recommend using cookies since it provides some protection against XSS and the easiest to deal with overall.

This guide has 2 sections on sessions:

- Basic session API: Create a basic session API using your database driver/ORM of choice.
- Cookies: Define your session cookie using your JavaScript framework of choice.

To learn how to implement auth using the API you created, see the tutorials section. If you want to learn from real-life projects, see the examples section.
