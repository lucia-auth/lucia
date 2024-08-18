import type {
	Adapter,
	DatabaseSession,
	RegisteredDatabaseSessionAttributes,
	DatabaseUser,
	RegisteredDatabaseUserAttributes,
	UserId
} from 'lucia';
import { Collection, ObjectId } from 'mongodb';

interface UserDoc extends RegisteredDatabaseUserAttributes {
	_id: ObjectId;
	__v?: any;
}

interface SessionDoc extends RegisteredDatabaseSessionAttributes {
	_id: string;
	__v?: any;
	user_id: UserId;
	expires_at: Date;
}

export class MongodbAdapter implements Adapter {
	private Session: Collection<SessionDoc>;
	private User: Collection<UserDoc>;

	constructor(Session: Collection<SessionDoc>, User: Collection<UserDoc>) {
		this.Session = Session;
		this.User = User;
	}

	public async deleteSession(sessionId: string): Promise<void> {
		await this.Session.findOneAndDelete({ _id: sessionId });
	}

	public async deleteUserSessions(userId: UserId): Promise<void> {
		await this.Session.deleteMany({ user_id: userId });
	}

	public async getSessionAndUser(
		sessionId: string
	): Promise<[session: DatabaseSession | null, user: DatabaseUser | null]> {
		// await necessary for mongoose
		const sessionDoc = await this.Session.findOne({ _id: sessionId });
		if (!sessionDoc) return [null, null];

		const userDoc = await this.User.findOne({
			_id: new ObjectId(sessionDoc.user_id)
		});
		if (!userDoc) return [null, null];

		const session = transformIntoDatabaseSession(sessionDoc as SessionDoc);
		const user = transformIntoDatabaseUser(userDoc);
		return [session, user];
	}

	public async getUserSessions(userId: UserId): Promise<DatabaseSession[]> {
		const sessions = await this.Session.find(
			{ user_id: userId },
			{
				projection: {
					// MongoDB driver doesn't use the extra fields that Mongoose does
					// But, if the dev is passing in mongoose.connection, these fields will be there
					__v: 0,
					_doc: 0
				}
			}
		).toArray();

		return sessions.map((val) => transformIntoDatabaseSession(val));
	}

	public async setSession(session: DatabaseSession): Promise<void> {
		const value: SessionDoc = {
			_id: session.id,
			user_id: session.userId,
			expires_at: session.expiresAt,
			...session.attributes
		};

		await this.Session.insertOne(value);
	}

	public async updateSessionExpiration(
		sessionId: string,
		expiresAt: Date
	): Promise<void> {
		await this.Session.findOneAndUpdate(
			{ _id: sessionId },
			{ $set: { expires_at: expiresAt } }
		);
	}

	public async deleteExpiredSessions(): Promise<void> {
		await this.Session.deleteMany({
			expires_at: {
				$lte: new Date()
			}
		});
	}
}

function transformIntoDatabaseUser(value: UserDoc): DatabaseUser {
	delete value.__v;
	const { _id: id, ...attributes } = value;
	return {
		id: id.toString(),
		attributes
	};
}

function transformIntoDatabaseSession(value: SessionDoc): DatabaseSession {
	delete value.__v;
	const {
		_id: id,
		user_id: userId,
		expires_at: expiresAt,
		...attributes
	} = value;
	return {
		id,
		userId,
		expiresAt,
		attributes
	};
}