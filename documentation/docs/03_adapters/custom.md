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
    refreshToken: string
) => Promise<DatabaseUser<Record<string, any>> | null>;
```

#### Parameters

| name         | type   | description                          |
| ------------ | ------ | ------------------------------------ |
| refreshToken | string | `refresh_token.refresh_token` column |

#### Returns

Returns `null` if a user does not exist.

| name         | type         | description |
| ------------ | ------------ | ----------- |
| DatabaseUser | DatabaseUser |             |

### getUserByIdentifierToken

Gets the row from `user` table with the identifier token and returns it as an object.

```ts
const getDataByIdentifierToken: (
    identifierToken: string
) => Promise<DatabaseUser<Record<string, any>> | null>;
```

#### Parameters

| name            | type   | description                    |
| --------------- | ------ | ------------------------------ |
| identifierToken | string | `user.identifier_token` column |

#### Returns

Returns `null` if a user does not exist.

| name         | type         | description |
| ------------ | ------------ | ----------- |
| DatabaseUser | DatabaseUser |             |

### getUserById

Gets the row from `user` table with the user id and returns it as an object.

```ts
const getDataByIdentifierToken: (
    userId: string
) => Promise<DatabaseUser<Record<string, any>> | null>;
```

#### Parameters

| name            | type   | description                    |
| --------------- | ------ | ------------------------------ |
| identifierToken | string | `user.identifier_token` column |

#### Returns

Returns `null` if a user does not exist.

| name | type                                           | description |
| ---- | ---------------------------------------------- | ----------- |
|      | [DatabaseUser](/references/types#databaseuser) |             |

### createUser

Creates a new row in `user` table.

```ts
const createAccount: (
    userId: string,
    data: {
        hashed_password: string | null;
        identifier_token: string;
        user_data: Record<string, any>;
    }
) => Promise<void>;
```

#### Parameters

| name                  | type                | description                              |
| --------------------- | ------------------- | ---------------------------------------- |
| userId                | string              | `id` column                              |
| data.hashed_password  | string              | `hashed_password` column                 |
| data.identifier_token | string              | `identifier_token` column                |
| data.user_data        | Record<string, any> | Each keys should saved as its own column |

### deleteUser

Deletes a row in `user` table where the user id matches.

```ts
const deleteUser: (userId: string) => Promise<void>;
```

#### Parameters

| name   | type   | description |
| ------ | ------ | ----------- |
| userId | string | `id` column |

### setRefreshToken

Creates a new row in `refresh_token` table.

```ts
const setRefreshToken: (userId: string, refreshToken: string) => Promise<void>;
```

#### Parameters

| name         | type   | description                          |
| ------------ | ------ | ------------------------------------ |
| userId       | string | `refresh_token.user_id` column       |
| refreshToken | string | `refresh_token.refresh_token` column |

### deleteRefreshToken

Deletes a row in `refresh_token` table where the refresh token matches.

```ts
const deleteRefreshToken: (refreshToken: string) => Promise<void>;
```

#### Parameters

| name         | type   | description            |
| ------------ | ------ | ---------------------- |
| refreshToken | string | `refresh_token` column |

### deleteUserRefreshTokens

Deletes all rows in `refresh_token` table where the user id matches.

```ts
const deleteUserRefreshTokens: (userId: string) => Promise<void>;
```

#### Parameters

| name   | type   | description                    |
| ------ | ------ | ------------------------------ |
| userId | string | `refresh_token.user_id` column |

### updateUser

Updates user's column where the value is not `undefined` (If the value is `null`, the column value should be set to `null` as it is a value).

```ts
const updateUser: (
    userId: string,
    data: {
        identifier_token?: string | null;
        hashed_password?: string | null;
        user_data?: Record<string, any>;
    }
) => Promise<DatabaseUser<Record<string, any>>>;
```

#### Parameters

| name                  | type                           | description                                          |
| --------------------- | ------------------------------ | ---------------------------------------------------- |
| userId                | string                         | `user_id` column                                     |
| data.identifier_token | string, null, undefined        | Value of `user.identifier_token` column              |
| data.hashed_password  | string, null, undefined        | Value of `user.hashed_password` column               |
| data.user_data        | Record<string, any>, undefined | Each key/values are their own column in `user` table |

#### Returns

\*Throws an error if a user doesn't exist.

| name | type                                           | description |
| ---- | ---------------------------------------------- | ----------- |
|      | [DatabaseUser](/references/types#databaseuser) |             |

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

Tests should be done using `@lucia-sveltekit/adapter-test`.

### testAdapter

```ts
const testAdapter: (adapter: Adapter, db: Database) => Promise<void>;
```

#### Parameters

| name    | type                        | description |
| ------- | --------------------------- | ----------- |
| adapter | [Adapter](/adapters/custom) |             |
| db      | Database                    |             |

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
