# `@lucia-auth/adapter-session-unstorage`

[Unstorage](https://unstorage.unjs.io/) session adapter for Lucia

**[Lucia documentation](https://lucia-auth.com)**

**[Changelog](https://github.com/pilcrowOnPaper/lucia/blob/main/packages/session-adapter-unstorage/CHANGELOG.md)**

## Installation

```
npm install @lucia-auth/adapter-session-unstorage
```

`lucia-auth@0.11.x` recommended.

## Usage

```ts
import lucia from "lucia-auth";
import Unstorage from "@lucia-auth/adapter-session-unstorage";
import prisma from "@lucia-auth/adapter-prisma";

const session = createStorage();

export const auth = lucia({
	adapter: {
		user: prisma(), // any database adapter
		session: Unstorage({ session })
	}
});
```

## Testing

```
pnpm test
```
