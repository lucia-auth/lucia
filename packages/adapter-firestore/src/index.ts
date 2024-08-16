import {
	collection,
	deleteDoc,
	doc,
	Firestore,
	getDoc,
	getDocs,
	getFirestore,
	query,
	setDoc,
	Timestamp,
	updateDoc,
	where,
	writeBatch
} from "firebase/firestore";
import type {
	Adapter,
	DatabaseSession,
	DatabaseUser,
	RegisteredDatabaseSessionAttributes,
	RegisteredDatabaseUserAttributes,
	UserId
} from "lucia";

interface UserDoc extends RegisteredDatabaseUserAttributes {
	id: UserId;
}

interface SessionDoc extends RegisteredDatabaseSessionAttributes {
	id: string;
	userId: UserId;
	expiresAt: Timestamp;
}

export class FirestoreAdapter implements Adapter {
	private sessionCollection: ReturnType<typeof collection>;
	private userCollection: ReturnType<typeof collection>;

	constructor(firestoreDb: Firestore, {user, session}: {user: string, session: string}) {
		this.sessionCollection = collection(firestoreDb, session);
		this.userCollection = collection(firestoreDb, user);
	}

	public async deleteSession(sessionId: string): Promise<void> {
		const sessionDocRef = doc(this.sessionCollection, sessionId);
		await deleteDoc(sessionDocRef);
	}

	public async deleteUserSessions(userId: UserId): Promise<void> {
		const q = query(this.sessionCollection, where("userId", "==", userId));
		const querySnapshot = await getDocs(q);
		const batch = writeBatch(getFirestore());
		querySnapshot.forEach((doc) => batch.delete(doc.ref));
		await batch.commit();
	}

	public async getSessionAndUser(
		sessionId: string
	): Promise<[session: DatabaseSession | null, user: DatabaseUser | null]> {
		const sessionDocRef = doc(this.sessionCollection, sessionId);
		const sessionSnapshot = await getDoc(sessionDocRef);

		if (!sessionSnapshot.exists()) return [null, null];
		const sessionDoc = sessionSnapshot.data() as SessionDoc; 	
		
		const userDocRef = doc(this.userCollection, sessionDoc.userId);
		const userSnapshot = await getDoc(userDocRef);
		
		if (!userSnapshot.exists()) return [null, null];
		const userDoc = userSnapshot.data() as UserDoc;

		const session = transformIntoDatabaseSession(sessionDoc);
		const user = transformIntoDatabaseUser(userDoc);

		return [session, user];
	}

	public async getUserSessions(userId: UserId): Promise<DatabaseSession[]> {
		const q = query(this.sessionCollection, where("userId", "==", userId));
		const querySnapshot = await getDocs(q);

		return querySnapshot.docs.map((doc) => transformIntoDatabaseSession(doc.data() as SessionDoc));
	}

	public async setSession(session: DatabaseSession): Promise<void> {
		const sessionDoc: SessionDoc = {
			id: session.id,
			userId: session.userId,
			expiresAt: Timestamp.fromDate(session.expiresAt),
			...session.attributes
		};
		const sessionDocRef = doc(this.sessionCollection, session.id);
		await setDoc(sessionDocRef, sessionDoc);
	}

	public async updateSessionExpiration(sessionId: string, expiresAt: Date): Promise<void> {
		const sessionDocRef = doc(this.sessionCollection, sessionId);
		await updateDoc(sessionDocRef, { expiresAt });
	}

	public async deleteExpiredSessions(): Promise<void> {
		const q = query(this.sessionCollection, where("expiresAt", "<=", new Date()));
		const querySnapshot = await getDocs(q);
		const batch = writeBatch(getFirestore());
		querySnapshot.forEach((doc) => batch.delete(doc.ref));
		await batch.commit();
	}
}

function transformIntoDatabaseUser(value: UserDoc): DatabaseUser {
	const { id, ...attributes } = value;
	return {
		id,
		attributes
	};
}

function transformIntoDatabaseSession(value: SessionDoc): DatabaseSession {
	const { id, userId, expiresAt, ...attributes } = value;
	return {
		id,
		userId,
        expiresAt: value.expiresAt.toDate(),
		attributes
	};
}
