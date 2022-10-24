# Tests for adapters for Lucia

Provides tests for creating adapters for Lucia.

```ts
interface Database {
	getRefreshTokens: () => Promise<RefreshTokensSchema[]>;
	getUsers: () => Promise<UsersSchema[]>;
	clearRefreshTokens: () => Promise<void>;
	clearUsers: () => Promise<void>;
	insertRefreshToken: (data: RefreshTokensSchema) => Promise<void>;
	insertUser: (data: UsersSchema) => Promise<void>;
}

interface UsersSchema {
	id: string;
	identifier_token: string;
	hashed_password: string | null;
	username: string; // unique, string
	email: string; // unique, string
}

interface RefreshTokensSchema {
	refresh_token: string;
	user_id: string;
}
```

```ts
import { testAdapter } from "@lucia-sveltekit/adapter-test";
import type { Adapter } from "lucia-sveltekit/types";

const db: Database;
const adapter: Adapter;

testAdapter(adapter, db);
```
