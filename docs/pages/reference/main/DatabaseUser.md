---
title: "DatabaseUser"
---

# `DatabaseUser`

Represents a session stored in a database.

## Definition

```ts
//$ DatabaseUserAttributes=/reference/main/DatabaseUserAttributes
interface DatabaseUser {
	id: string;
	attributes: DatabaseUserAttributes;
}
```

### Properties

-   `id`
-   `userId`
-   `expiresAt`
-   `attributes`
