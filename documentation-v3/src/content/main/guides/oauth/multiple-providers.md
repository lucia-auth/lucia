---
title: "Multiple OAuth providers"
---

## Database

To support multiple OAuth sign-in methods, we can store the OAuth credentials in its own OAuth account table instead of the user table. Here, the combination of `provider` and `provider_user_id` should be unique (composite primary key).

| column             | type     | description    |
| ------------------ | -------- | -------------- |
| `provider`         | `string` | OAuth provider |
| `provider_user_id` | `string` | OAuth user ID  |
| `user_id`          | `string` | user ID        |

Here's an example with SQLite:

```sql
CREATE TABLE oauth_account {
    provider TEXT NOT NULL,
    provider_user_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    PRIMARY KEY (provider, provider_user_id),
    FOREIGN KEY (user_id) REFERENCES user(id)
}
```

We can then remove the `github_id` column etc from the user table.

## Validating callback

Instead of the user table, we can now use the OAuth account table to check if a user is already registered. If not, in an transaction, create the user and OAuth account.

```ts
const tokens = await githubAuth.validateAuthorizationCode(code);
const githubUser = await githubAuth.getUser(tokens.accessToken);

const existingAccount = await db
	.table("oauth_account")
	.where("provider", "=", "github")
	.where("provider_user_id", "=", githubUser.id)
	.get();

if (existingAccount) {
	const session = await auth.createSession(existingAccount.user_id, {});

    // ...
}

const userId = generateId(15);

await db.beginTransaction();
await db.table("user").insert({
	id: userId,
	username: github.login
});
await db.table("oauth_account").insert({
	provider: "github",
	provider_user_id: githubUser.id,
	user_id: userId
});
await db.commit();

const session = await auth.createSession(userId, {});

// ...
```
