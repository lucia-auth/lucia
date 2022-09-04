Lucia is an authentication library for SvelteKit that handle the bulk of the authentication process. It is bare-bone by design, allowing it to be used in many ways, but simple and straight forward enough to be easy to understand and to use. That said, it implements token theft detection, rotating refresh token, and silent refresh, to make sure your authentication system is secure.

It's important to note that this __isn't__ an out-of-the-box authentication library. It does not validate the user's input nor does it not provide UI elements or OAuth authentication (though it can be implemented using Lucia). These are out of the scope of this library and is left up to you. 

Lucia is a toolbox for creating your own authentication, and provides methods like `createUser` which saves the user in the database and generate a set of tokens:

```js
// params: auth method, identifier, options
auth.createUser("email", "user@example.com", { password: "123456" });
```

> This library requires a database to work. If you need a free option, check out [Supabase](https://supabase.com), which Lucia supports out of the box.
