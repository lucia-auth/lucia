---
order: 0
layout: "@layouts/DocumentLayout.astro"
title: "SurrealDB"
---

An adapter for SurrealDB

```ts
const adapter = (
	args: {
	    surreal: Surreal, // SurrealDB client
        // opts is optional, if your application needs to use different "table names" for users & sessions you can set it up here 
    	opts?: {
            targets: {
                user: string, // "user" by default
                session: string // "session" by default
            }
        }
    } | {
        uri: string; // SurrealDB URI
        user: string; // SurrealDB user
        pass: string;// SurrealDB pass
        ns: string; // SurrealDB namespace
        db: string; // SurrealDB database
        // opts is optional, if your application needs to use different "table names" for users & sessions you can set it up here 
        opts?: {
            targets: {
                user: string, // "user" by default
                session: string // "session" by default
            }
        }
    },
	errorHandler: (error: Error) => void = () => { }
) => Adapter
```

### Parameter

`args` **see Args type def**

`handleError()` may be provided which will be called on [unknown errors](/learn/basics/handle-errors#known-errors) - database errors Lucia doesn't expect the adapter to catch. You can also throw custom errors inside it, which will be thrown when an unknown database error occurs inside [`Lucia`](/reference/api/server-api#lucia) methods.

```ts
type Opts = {
	targets: {
		user: string,
		session: string
	}
};

export type Args = {
	surreal: Surreal,
	opts?: Opts
} | {
	uri: string;
	user: string;
	pass: string;
	ns: string;
	db: string;
	opts?: Opts
}
```

## Installation

```bash
npm install lucia-auth-adapter-surrealdb
pnpm install lucia-auth-adapter-surrealdb
yarn add lucia-auth-adapter-surrealdb
```

## Usage

```ts
// required imports
import lucia from "lucia-auth";
import surrealdb from "lucia-auth-adapter-surrealdb";

// init surrealdb adapter 
const adapter = surrealdb({
    uri: 'surrealdb-uri', // Example: 'http://localhost:8000/rpc',
    user: 'surrealdb-user',
    pass: 'surrealdb-pass',
    ns: 'my-ns',
    db: 'my-db'
});

// init lucia using the adapter
const auth = lucia({
    adapter,
    env: 'DEV'
});

// OR
// only if you want to build the surrealdb client yoursef 
import Surreal from "$lib/surreal";

// build and init surrealdb client
const surreal = new Surreal('surrealdb-uri');

await surreal.signin({
    user: 'surrealdb-user',
    pass: 'surrealdb-pass',
});

await surreal.use('my-ns', 'my-db');

// init lucia passing surrealdb client to the adapter
const adapter = surrealdb({
    surreal
});

// init lucia using the adapter
const auth = lucia({
    adapter,
    env: 'DEV'
});

export type Auth = typeof auth;
```

## SurrealDB 

You need to define a new index for provider_id to be unique on your "user" table.

```sql
DEFINE INDEX provider_id_unique ON TABLE user COLUMNS provider_id UNIQUE;
```
