## Overview

An adapter takes the following structure:

```ts
interface Adapter {
    getUserByRefreshToken: (
        refreshToken: string
    ) => Promise<DatabaseUser<Record<string, any>> | null>;
    getByFromIdentifierToken: (
        identifierToken: string
    ) => Promise<DatabaseUser<Record<string, any>> | null>;
    getUserById: (
        identifierToken: string
    ) => Promise<DatabaseUser<Record<string, any>> | null>;
    setUser: (
        userId: string,
        data: {
            identifier_token: string;
            hashed_password: string | null;
            user_data: Record<string, any>;
        }
    ) => Promise<void>;
    deleteUser: (userId: string) => Promise<void>;
    setRefreshToken: (refreshToken: string, userId: string) => Promise<void>;
    deleteRefreshToken: (refreshToken: string) => Promise<void>;
    deleteUserRefreshTokens: (userId: string) => Promise<void>;
    updateUser: (
        userId: string,
        data: {
            identifier_token?: string | null;
            hashed_password?: string | null;
            user_data?: Record<string, any>;
        }
    ) => Promise<DatabaseUser<Record<string, any>>>;
}
```

## Properties

### getUserByRefreshToken

Gets the row from `user` table connected to the refresh token and returns it as an object.

```ts
const getDataByRefreshToken: (
    refreshToken: string // column refresh_token.refresh_token
) => Promise<DatabaseUser<Record<string, any>> | null>; // null if a user does not exist.
```

### getUserByIdentifierToken

Gets the row from `user` table with the identifier token and returns it as an object.

```ts
const getDataByIdentifierToken: (
    identifierToken: string // column user.identifier_token
) => Promise<DatabaseUser<Record<string, any>> | null>; // null if the user does not exist
```

### getUserById

Gets the row from `user` table with the user id and returns it as an object.

```ts
const getDataByIdentifierToken: (
    userId: string // column user.id
) => Promise<DatabaseUser<Record<string, any>> | null>; // null if the user does not exist
```

### createUser

Creates a new row in `user` table.

```ts
const createAccount: (
    userId: string, // column user.id
    data: {
        hashed_password: string | null; // column hashed_password
        identifier_token: string; // column identifier_token
        user_data: Record<string, any>; // each keys should saved as its own column
    }
) => Promise<void>;
```

### deleteUser

Deletes a row in `user` table where the user id matches. Throws error `AUTH_INVALID_USER_ID` if the user does not exist.

```ts
const deleteUser: (
    userId: string // column user.id
) => Promise<void>;
```

### setRefreshToken

Creates a new row in `refresh_token` table.

```ts
const setRefreshToken: (
    userId: string, // column refresh_token.user_id
    refreshToken: string // column refresh_token.refresh_token
) => Promise<void>;
```

### deleteRefreshToken

Deletes a row in `refresh_token` table where the refresh token matches.

```ts
const deleteRefreshToken: (
    refreshToken: string // column refresh_token
) => Promise<void>;
```

### deleteUserRefreshTokens

Deletes all rows in `refresh_token` table where the user id matches.

```ts
const deleteUserRefreshTokens: (
    userId: string // column refresh_token.user_id
) => Promise<void>;
```

### updateUser

Updates user's column where the value is not `undefined` (If the value is `null`, the column value should be set to `null` as it is a value). Throws error `AUTH_INVALID_USER_ID` if the user does not exist.

```ts
const updateUser: (
    userId: string, // column user.id
    data: {
        identifier_token?: string | null; // value of column user.identifier_token
        hashed_password?: string | null; // value of column user.hashed_password
        user_data?: Record<string, any>; // each key/values are their own column in table user
    }
) => Promise<DatabaseUser<Record<string, any>>>;
```

## Errors

Database related errors should be thrown using Lucia's [`Error`](/references/error-handling)

| name                            | description                                   |
| ------------------------------- | --------------------------------------------- |
| DATABASE_FETCH_FAILED           | Failed to get data from database              |
| DATABASE_UPDATE_FAILED          | Failed to update database (write, delete)     |
| AUTH_DUPLICATE_IDENTIFIER_TOKEN | Violates `identifier_token` unique constraint |
| AUTH_DUPLICATE_USER_DATA        | Violates some column's unique constraint      |
| AUTH_INVALID_USER_ID            | Violates some column's unique constraint      |

## Tests

Tests should be done using `@lucia-sveltekit/adapter-test`. For the database, `users` table should also have a `email` and `username` column (string, unique).

```bash
import { testAdapter } from "@lucia-sveltekit/adapter-test"
```

### testAdapter

```ts
const testAdapter: (adapter: Adapter, db: Database) => Promise<void>;
```

#### Types

```ts
interface UserSchema {
    id: string;
    identifier_token: string;
    hashed_password: string | null;
    username: string;
    email: string;
}

interface RefreshTokenSchema {
    refresh_token: string;
    user_id: string;
}

interface Database {
    getRefreshTokens: () => Promise<RefreshTokenSchema[]>; // get all rows/docs from refresh_token
    getUsers: () => Promise<UserSchema[]>; // get all rows/docs from user
    clearRefreshTokens: () => Promise<void>; // clear all rows/docs from refresh_token
    clearUsers: () => Promise<void>; // clear all rows/docs from user
    insertRefreshToken: (data: RefreshTokenSchema) => Promise<void>; // insert row/doc into user
    insertUser: (data: UserSchema) => Promise<void>; // insert row/doc into refresh_token
}
```
