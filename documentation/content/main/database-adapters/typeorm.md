---
title: "TypeORM adapter"
description: "Learn how to use TypeORM with Lucia"
---

Adapter for [TypeORM](https://www.typeorm.io) provided by the TypeORM adapter package.

```ts
import { typeorm } from "@lucia-auth/adapter-typeorm";
```

```ts
const typeorm: (
	dataSource: DataSource,
	tables: {
		user: EntityTarget<ObjectLiteral>;
		key: EntityTarget<ObjectLiteral>;
		session: EntityTarget<ObjectLiteral> | null;
	}
) => InitializeAdapter<Adapter>;
```

##### Parameters

| name             | type                                  | description                                                                          | optional |
| ---------------- | ------------------------------------- | ------------------------------------------------------------------------------------ | :------: |
| `dataSource`     | `DataSource`                          | TypeORM datasource. [Read more](https://orkhan.gitbook.io/typeorm/docs/data-source). |          |
| `tables`         |                                       |                                                                                      |          |
| `tables.user`    | `EntityTarget<ObjectLiteral>`         |                                                                                      |          |
| `tables.key`     | `EntityTarget<ObjectLiteral>`         |                                                                                      |          |
| `tables.session` | `EntityTarget<ObjectLiteral> \| null` | Can be `null` when using alongside a session adapter                                 |          |

## Installation

```
npm i @lucia-auth/adapter-typeorm
pnpm add @lucia-auth/adapter-typeorm
yarn add @lucia-auth/adapter-typeorm
```

## Usage

```ts
import { lucia } from "lucia";
import { typeorm } from "@lucia-auth/adapter-typeorm";
import { DataSource } from "typeorm";

const dataSource = new DataSource({
	// ...
});

const auth = lucia({
	adapter: typeorm(dataSource)
	// ...
});
```

## Database entity

You can choose any table names, just make sure to define them in the `tables` argument. **The `id` columns are not UUID types with the default configuration.**

### User entity

You can add additional columns to store user attributes.

```ts
@Entity({ name: "user" })
export class User {
	@PrimaryColumn({ name: "id", type: "text" })
	id: string;

	@OneToMany(() => Session, (session) => session.user_id)
	@JoinColumn({ name: "id", referencedColumnName: "user_id" })
	sessions: Relation<Session[]>;
}
```

### Key table

Make sure to update the foreign key statement if you change the user table name.

```ts
@Entity({ name: "key" })
export class Key {
	@PrimaryColumn({ name: "id", type: "text" })
	id: string;

	@Column({ name: "user_id", type: "text" })
	@Index()
	user_id: string;

	@Column({ name: "hashed_password", type: "text", nullable: true })
	hashed_password: string | null;

	@OneToOne(() => User)
	@JoinColumn({ name: "user_id", referencedColumnName: "id" })
	user: User;
}
```

### Session table

You can add additional columns to store session attributes. Make sure to update the foreign key statement if you change the user table name.

```ts
@Entity({ name: "session" })
export class Session {
	@PrimaryColumn({ name: "id", type: "text" })
	id: string;

	@Column({ name: "user_id", type: "text" })
	@Index()
	user_id: string;

	@Column({ name: "active_expires", type: "bigint" })
	active_expires: number;

	@Column({ name: "idle_expires", type: "bigint" })
	idle_expires: number;

	@ManyToOne(() => User, (user) => user.sessions)
	@JoinColumn({ name: "user_id", referencedColumnName: "id" })
	user: Relation<user>;
}
```
