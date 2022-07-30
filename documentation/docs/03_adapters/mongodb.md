## Overview

An adapter to use with MongoDB.

```ts
import mongodb from "@lucia-sveltekit/adapter-mongodb";

const auth = lucia({
    adapter: mongodb(url),
    // ...
});
```

#### Parameters

| name | type   | description            |
| ---- | ------ | ---------------------- |
| url  | string | MongoDB connection URL |

## Tables

### user

`User` may have additional columns (which are represented by `[user_data]`).

```ts
{
  "bsonType": "object",
  "title": "User",
  "required": ["identifier_token"]
  "properties": {
    "_id": string,
    "identifier_token": string,
    "hashed_password": string | null,
    [user_data]: any
  }
}
```

### refresh_token

```ts
{
  "bsonType": "object",
  "title": "RefreshToken",
  "required": ["refresh_token", "user_id"]
  "properties": {
    "_id": objectId,
    "refresh_token": string,
    "user_id": string,
  }
}
```

## Contributors

- [@SkepticMystic](https://github.com/SkepticMystic)