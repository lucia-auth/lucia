/**
 * This script is used to test the Firestore adapter.
 */
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { collection, deleteDoc, doc, getDocs, getFirestore, setDoc } from 'firebase/firestore';

import { databaseUser, testAdapter } from "@lucia-auth/adapter-test";
import dotenv from "dotenv";
import { resolve } from "path";
import { FirestoreAdapter } from "../src/index.js";

/**
 * Environment variables configuration. Change with .env.example or create a .env file.
 */
dotenv.config({ path: `${resolve()}/.env.example` });

if(!process.env.FIREBASE_PROJECT_ID)
	throw new Error("FIREBASE_PROJECT_ID is not defined");

/**
 * Firestore client configuration.
 */
const clientConfig = {
	projectId: process.env.FIREBASE_PROJECT_ID
};

/**
 * Recommended way to get the Firestore client app.
 * @returns the Firestore client app.
 */
const getClientApp = (): FirebaseApp => {
	if (getApps().length) return getApp();

	const app = initializeApp(clientConfig);

	return app;
};

/**
 * Firestore database client instance.
 */
const db = getFirestore(getClientApp());

/**
 * Reference to the Firestore collections users and sessions.
 */
const User = collection(db, "users");
const Session = collection(db, "sessions");

await wipeCollections();

const adapter = new FirestoreAdapter(db, {
	user: "users",
	session: "sessions"
});

/**
 * Add a user to the Firestore database.
 */
await setDoc(doc(User, databaseUser.id),{
	id: databaseUser.id,
	username: databaseUser.attributes.username
});

/**
 * Run the tests.
 */
await testAdapter(adapter);

await wipeCollections();

process.exit(0);

/**
 * Function to clear the collections users and sessions.
 */
async function wipeCollections() {
	await getDocs(User).then((snapshot) => {
		snapshot.forEach((doc) => {
			deleteDoc(doc.ref);
		});
	});
	
	await getDocs(Session).then((snapshot) => {
		snapshot.forEach((doc) => {
			deleteDoc(doc.ref);
		});
	});
}