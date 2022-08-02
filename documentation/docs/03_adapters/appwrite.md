## Overview

An adapter to use with AppWrite's document database.

### Installation

```bash
npm i @lucia-sveltekit/adapter-appwrite
```

## Usage

```ts
import appwrite from "@lucia-sveltekit/adapter-appwrite";

const config = {
    project_id: "",
    api: {
        endpoint: "",
        key: "",
    },
    database: {
        id: "",
        user_collection_id: "",
        refresh_token_collection_id: "",
    },
};

const auth = lucia({
    adapter: appwrite(config),
    // ...
});
```

#### Parameters

| name                                        | type   | description                       |
| ------------------------------------------- | ------ | --------------------------------- |
| config.project_id                           | string | AppWrite project id               |
| config.api.endpoint                         | string | Project api endpoint              |
| config.api.key                              | string | Api Key (Permissions: select all) |
| config.database.id                          | string | Database id                       |
| config.database.user_collection_id          | string | Collection id of `user`           |
| config.database.refresh_token_collection_id | string | Collection id of `refresh_token`  |

## Collections

### user

`user` may have additional columns (which are represented by `[user_data]`).

#### Attributes

| attribute id     | type                 | required |
| ---------------- | -------------------- | -------- |
| identifier_token | string (length: 255) | true     |
| hashed_password  | string (length: 255) |          |
| [user_data]      | any                  | any      |

#### Indexes

| index key        | type   | attributes             |
| ---------------- | ------ | ---------------------- |
| user_id          | unique | $id (ASC)              |
| identifier_token | unique | identifier_token (ASC) |
| [user_data]      | any    | any                    |

### refresh_token

#### Attributes

| attribute id  | type                 | required |
| ------------- | -------------------- | -------- |
| refresh_token | string (length: 300) | true     |
| user_id       | string (length: 20)  | true     |

#### Indexes

| index key     | type   | attributes          |
| ------------- | ------ | ------------------- |
| refresh_token | unique | refresh_token (ASC) |
| user_id       | key    | user_id (ASC)       |

## Issues

-   Lucia will return `AUTH_DUPLICATE_USER_DATA` error instead of `AUTH_DUPLICATE_IDENTIFIER_TOKEN`.
