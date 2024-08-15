---
title: "Firebase Firestore"
---

# Firestore

The `@lucia-auth/adapter-firestore` package provides adapters for Firebase Firestore.

```
npm install @lucia-auth/adapter-firestore
```

## Setup

For instructions on how to configure a Firestore database, please refer to the following link:
[Firestore Quickstart Guide](https://firebase.google.com/docs/firestore/quickstart)

## Usage

You must handle the database connection manually.

User ID can be numeric or object ID (see [Define user ID type](/basics/users#define-user-id-type)) but session ID must be a string type.

```ts
import { Lucia } from "lucia";
import { Firestore } from "@lucia-auth/adapter-firestore";
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { collection, getFirestore } from 'firebase/firestore';

dotenv.config({ path: `${resolve()}/.env` });

const clientConfig = {
	projectId: process.env.FIREBASE_PROJECT_ID
};

const getClientApp = (): FirebaseApp => {
	if (getApps().length)
		return getApp();

	const app = initializeApp(clientConfig);
	return app;
};
const db = getFirestore(getClientApp());

const User = collection(db, "users");
const Session = collection(db, "sessions");

const adapter = new FirestoreAdapter(Session, User);
```
