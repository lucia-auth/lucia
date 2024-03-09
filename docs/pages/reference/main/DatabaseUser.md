---
title: "DatabaseUser"
---

# `DatabaseUser`

Represents a user stored in a database.

## Definition

```ts
//$ DatabaseUserAttributes=/reference/main/DatabaseUserAttributes
//$ UserId=/reference/main/UserId
interface DatabaseUser {
	id: $$UserId;
	attributes: DatabaseUserAttributes;
}
```

### Properties

-   `id`
-   `attributes`
