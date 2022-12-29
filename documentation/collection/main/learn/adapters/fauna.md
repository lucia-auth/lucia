---
_order: 0
title: "Fauna"
---

An adapter for Fauna database.

```ts
const adapter: (faunaClient: FaunaClient) => AdapterFunction<Adapter>;
```

### Parameter

| name        | type     | description           | optional |
| ----------- | -------- | --------------------- | -------- |
| faunaClient | `Client` | Fauna client instance |          |

### Errors

The adapter and Lucia will not not handle [unknown errors](/learn/basics/error-handling#known-errors), database errors Lucia doesn't expect the adapter to catch. When it encounters such errors, it will throw a `FaunaError`.

## Installation

```bash
npm i @lucia-auth/adapter-fauna
pnpm add @lucia-auth/adapter-fauna
yarn add @lucia-auth/adapter-fauna
```

## Usage

```ts
import fauna from "@lucia-auth/adapter-fauna";
import faunadb from "faunadb";

const { Client } = faunadb;

const auth = lucia({
	adapter: fauna(new Client(options))
});
```

## Database models

Fauna follows loose models.

### `users`

You may add additional columns to store user attributes. Refer to [Store user attributes](/learn/basics/store-user-attributes).

```ts
{
    id: string,
    provider_id: string,
    hashed_password: string,
    ...attributes
}
```

### `sessions`

This is not required if you're only using the Fauna adapter for the `user` table via [`adapter.user`](/reference/configure/lucia-configurations#adapter) config.

```ts
{
    id: string,
    user_id: string,
    expires: number,
    idle_expires: number
}
```

## Create database commands

Run the following commands inside of the Shell tab in the Fauna dashboard to setup the appropriate collections and indexes.

Create collections:

```js
CreateCollection({ name: "user" });
CreateCollection({ name: "session" });
```

Create Indexes:

```js
CreateIndex({
	name: "user_by_id",
	source: Collection("user"),
	unique: true,
	terms: [{ field: ["data", "id"] }]
});
CreateIndex({
	name: "session_by_id",
	source: Collection("sessions"),
	unique: true,
	terms: [{ field: ["data", "id"] }]
});
CreateIndex({
	name: "session_by_userid",
	source: Collection("sessions"),
	unique: true,
	terms: [{ field: ["data", "user_id"] }]
});
CreateIndex({
	name: "user_by_providerid",
	source: Collection("users"),
	unique: true,
	terms: [{ field: ["data", "provider_id"] }]
});
```
