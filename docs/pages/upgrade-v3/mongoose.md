---
title: "Upgrade your Mongoose project to v3"
---

# Upgrade your Mongoose project to v3

Read this guide carefully as some parts depend on your current structure (**especially the collection names**), and feel free to ask questions on our Discord server if you have any questions.

## Update the adapter

The Mongoose adapter has been replaced with the MongoDB adapter.

```
npm install @lucia-auth/adapter-mongodb
```

Initialize the adapter:

```ts
import { MongoDBAdapter } from "@lucia-auth/adapter-mongodb";
import mongoose from "mongoose";

const adapter = new MongodbAdapter(
	mongoose.connection.collection("sessions"),
	mongoose.connection.collection("users")
);
```

## Update the session collection

Replace the `idle_expires` field with `expires_at` and update the Mongoose schema accordingly.

```ts
db.sessions.updateMany({}, [
	{
		$set: {
			expires_at: { $toDate: "$idle_expires" }
		}
	},
	{
		$unset: ["idle_expires", "active_expires"]
	}
]);
```

```ts
import mongoose from "mongoose";

const Session = mongoose.model(
	"Session",
	new mongoose.Schema(
		{
			_id: {
				type: String,
				required: true
			},
			user_id: {
				type: String,
				required: true
			},
			expires_at: {
				type: Date,
				required: true
			}
		} as const,
		{ _id: false }
	)
);
```

## Replace the key collection

Keys have been removed. You can keep using them but you may want to update your schema to better align with MongoDB.

### OAuth accounts

This database command adds a `github_id` field to users with a GitHub account based on the key collection.

```ts
db.users.aggregate([
	{
		$lookup: {
			from: "keys",
			localField: "_id",
			foreignField: "user_id",
			as: "github_accounts",
			pipeline: [
				{
					$match: {
						_id: {
							$regex: /^github:/
						}
					}
				}
			]
		}
	},
	{
		$match: {
			$expr: {
				$gt: [{ $size: "$github_accounts" }, 0]
			}
		}
	},
	{
		$set: {
			github_id: {
				$replaceOne: {
					input: { $arrayElemAt: ["$github_accounts._id", 0] },
					find: "github:",
					replacement: ""
				}
			}
		}
	},
	{
		$unset: ["github_accounts"]
	},
	{
		$merge: {
			into: "users",
			whenMatched: "merge"
		}
	}
]);
```

### Password accounts

This database command moves the `hashed_password` field from the keys collection to the users collection.

```ts
db.users.aggregate([
	{
		$lookup: {
			from: "keys",
			localField: "_id",
			foreignField: "user_id",
			as: "password_accounts",
			pipeline: [
				{
					$match: {
						hashed_password: {
							$ne: null
						}
					}
				}
			]
		}
	},
	{
		$match: {
			$expr: {
				$gt: [{ $size: "$password_accounts" }, 0]
			}
		}
	},
	{
		$set: {
			hashed_password: { $arrayElemAt: ["$password_accounts.hashed_password", 0] }
		}
	},
	{
		$unset: ["password_accounts"]
	},
	{
		$merge: {
			into: "users",
			whenMatched: "merge"
		}
	}
]);
```
