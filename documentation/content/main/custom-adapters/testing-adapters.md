---
_order: 2
title: "Testing adapters"
description: "Learn how to test your custom database adapters"
---

Lucia provides a package for testing adapters.

```
npm i @lucia-auth/adapter-test
pnpm add @lucia-auth/adapter-test
yarn add @lucia-auth/adapter-test
```

[`@lucia-auth/adapter-test`](/reference/adapter-test/lucia-auth-adapter-test) for a full reference.

## Setup

### Database model

Add `username` to `auth_user` table (`string`, unique).

| name     | type     | unique |
| -------- | -------- | ------ |
| username | `string` | true   |

### Type declaration

Declare the [`Lucia`](/reference/lucia-auth/types#lucia) namespace in a `.d.ts` file and `username` to `Lucia.UserAttributes`.

```ts
// lucia.d.ts
declare namespace Lucia {
	type Auth = any;
	type UserAttributes = {
		username: string;
	};
}
```

## Query handler

The test functions require a [`LuciaQueryHandler`](/reference/adapter-test/types#luciaqueryhandler) to interact with the database.

```ts
type LuciaQueryHandler = {
	user?: QueryHandler<TestUserSchema>;
	session?: QueryHandler<SessionSchema>;
	key?: QueryHandler<KeySchema>;
};

type QueryHandler<Schema> = {
	get: () => Promise<Schema[]>;
	insert: (data: Schema) => Promise<void>;
	clear: () => Promise<void>;
};
```

### `get()`

Gets all stored data from the table.

```ts
const: get: () => Promise<Schema[]>
```

### `insert()`

Adds the provided data to table.

```ts
const insert: (data: Schema) => Promise<void>;
```

### `clear()`

Clears all stored data from table.

```ts
const clear: () => Promise<void>;
```

## Running tests

Import one of the three testing function and provide both the adapter and query handler:

```ts
import { testAdapter } from "@lucia-auth/adapter-test";
import { LuciaError } from "lucia-auth";

const adapter = adapterKysely()(LuciaError);
await testAdapter(adapter, queryHandler);
```
