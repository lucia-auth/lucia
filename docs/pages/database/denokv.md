---
title: "Deno KV"
---

# Deno KV

The @lucia-auth/adapter-mongodb package providers adapters for [Deno KV](https://deno.com/kv).

```
npm install @lucia-auth/adapter-denokv@beta
```

## Usage

Pass the connection to your kv instance, along with your prefered key for users and sessions.

```ts
import { Lucia } from "lucia";
import { DenoKvAdapter } from "@lucia-auth/adapter-denokv";
import { openKv, type KvKeyPart } from "@deno/kv";

const kv = await openKv(); // should work if it's kv local instance, self-hosted or deno-deploy.

const userKey: KvKeyPart[] = ["users"];
const sessionsKey: KvKeyPart[] = ["sessions"];

const adapter = new DenoKvAdapter(kvDb, sessionsKey, usersKey);
```

## UserApi example for CRUD operations

```ts
// UsersApi.ts
// Example of how you could handle your user operations in a separate file.
import { openKv, type KvKeyPart } from "@deno/kv";
import type { DatabaseUser } from "lucia";

type User = DatabaseUser & {
	email?: string;
};

const kv = await openKv();
//userKey should be the same one used in the adapter
const userKey: KvKeyPart[] = ["users"];

const userKey = (userId) => [...userKey, userId];

export const getUsers = async () => {
	const iter = kvDb.list<User>({ prefix: usersKey });
	const users = [];
	for await (const userEntry of iter) users.push(userEntry.value);

	return users;
};

export const getUserById = async (id: string) => {
	const user = await kvDb.get<User>(userKey(id));
	return user.value;
};

export const createUser = async (newUser: User) => {
	await kvDb.set(userKey(newUser.id), newUser);
	return newUser;
};

export const updateUser = async (userId: string, newData: Partial<User>) => {
	const user = await getUserById(userId);
	if (!user) {
		throw Error("user not found");
	}
	const updatedUser = { ...user, ...newData };
	await kvDb.set(userKey(userId), updatedUser);
	return updatedUser;
};
```
