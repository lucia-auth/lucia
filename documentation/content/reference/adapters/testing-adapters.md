---
order: 2
title: "Testing adapters"
---

Lucia provides a package for testing adapters.

```bash
npm i @lucia-auth/adapter-test
pnpm add @lucia-auth/adapter-test
yarn add @lucia-auth/adapter-test
```

## Testing

### Database

Set `user(id)` to `string` (not auto-generated ids) and add `username` to `user` table (`string`, unique).

### Type declaration

You may need to declare the `Lucia` and SvelteKit's `App` namespace in a `.d.ts` file.

```ts
declare namespace Lucia {
	type Auth = any;
	type UserAttributes = {
		username: string;
	};
}

declare namespace App {
	interface Locals {}
}
```

## Reference

These can be imported from the package:

```ts
import { testAdapter } from "@lucia-auth/adapter-test";
```

### `testAdapter()`

Runs tests that checks if the adapter interacts with the database correctly.

```ts
const testAdapter: (adapter: Adapter, db: Database) => Promise<void>;
```

### `testAdapterErrors()`

Runs tests that checks if the adapter throws the correct errors. Used for testing officially supported adapters but is not required to pass for it to be used with Lucia.

```ts
const testAdapterErrors: (adapter: Adapter, db: Database) => Promise<void>;
```

### `testAdapterUserIdGeneration()`

Runs tests that checks if the database can create its own id (for `user`). Change `user(id)` to `UUID` or other auto-generated ids.

```ts
const testAdapter: (adapter: Adapter, db: Database) => Promise<void>;
```

### `testSessionAdapter()`

`testAdapter()` but for adapters only for `session` table.

```ts
const testSessionAdapter: (adapter: SessionAdapter, db: Database) => Promise<void>;
```

### `testSessionAdapterErrors`

`testAdapterErrors()` but for adapters only for `session` table.

```ts
const testSessionAdapterErrors: (adapter: SessionAdapter, db: Database) => Promise<void>;
```

### `testUserAdapter()`

`testAdapter()` but for adapters only for `user` table.

```ts
const testUserAdapter: (adapter: UserAdapter, db: Database) => Promise<void>;
```

### `testUserAdapterErrors`

`testAdapterErrors()` but for adapters only for `user` table.

```ts
const testUserAdapterErrors: (adapter: UserAdapter, db: Database) => Promise<void>;
```

## Types

### `Database`

Provides methods to add, get, and delete from each table. `get` methods return all data inside the table and `clear` methods deletes everything from the table.

```ts
export interface Database {
	getSessions: () => Promise<SessionSchema[]>;
	getUsers: () => Promise<UserSchema[]>;
	clearUsers: () => Promise<void>;
	clearSessions: () => Promise<void>;
	insertUser: (data: UserSchema) => Promise<void>;
	insertSession: (data: SessionSchema) => Promise<void>;
}
```
