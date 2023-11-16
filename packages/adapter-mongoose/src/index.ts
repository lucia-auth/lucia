import type {
	DatabaseSession,
	DatabaseSessionAttributes,
	DatabaseUser,
	DatabaseUserAttributes
} from "lucia";
import type { Adapter } from "lucia";
import type { Model } from "mongoose";

interface UserDoc extends DatabaseUserAttributes {
	_id: string;
	__v?: any;
}

interface SessionDoc extends DatabaseSessionAttributes {
	_id: string;
	__v?: any;
	user_id: string;
	expires_at: Date;
}

export class MongooseAdapter implements Adapter {
	private Session: Model<SessionDoc>;
	private User: Model<UserDoc>;

	constructor(Session: Model<SessionDoc>, User: Model<UserDoc>) {
		this.Session = Session;
		this.User = User;
	}

	public async deleteSession(sessionId: string): Promise<void> {
		await this.Session.findByIdAndDelete(sessionId);
	}

	public async deleteUserSessions(userId: string): Promise<void> {
		await this.Session.deleteMany({
			user_id: userId
		});
	}

	public async getSessionAndUser(
		sessionId: string
	): Promise<[session: DatabaseSession | null, user: DatabaseUser | null]> {
		const sessionUsers = await this.Session.aggregate([
			{ $match: { _id: sessionId } },
			{
				$lookup: {
					from: this.User.collection.name,
					localField: "user_id",
					// reliies on _id being a String, not ObjectId.
					foreignField: "_id",
					as: "userDocs"
				}
			}
		]).exec();

		const sessionUser = sessionUsers?.at(0) ?? null;
		if (!sessionUser) return [null, null];

		const { userDocs, ...sessionDoc } = sessionUser;
		const userDoc = userDocs?.at(0) ?? null;
		if (!userDoc) return [null, null];

		const session = transformIntoDatabaseSession(sessionDoc);
		const user = transformIntoDatabaseUser(userDoc);
		return [session, user];
	}

	public async getUserSessions(userId: string): Promise<DatabaseSession[]> {
		const sessions = await this.Session.find(
			{
				user_id: userId
			},
			DEFAULT_PROJECTION
		).lean();
		return sessions.map((val) => transformIntoDatabaseSession(val));
	}

	public async setSession(session: DatabaseSession): Promise<void> {
		const value: SessionDoc = {
			_id: session.id,
			user_id: session.userId,
			expires_at: session.expiresAt,
			...session.attributes
		};
		await new this.Session(value).save();
	}

	public async updateSessionExpiration(sessionId: string, expiresAt: Date): Promise<void> {
		await this.Session.findByIdAndUpdate(sessionId, {
			expires_at: expiresAt
		}).lean();
	}
}

const DEFAULT_PROJECTION = {
	$__: 0,
	__v: 0,
	_doc: 0
};

function transformIntoDatabaseUser(value: UserDoc): DatabaseUser {
	delete value.__v;
	const { _id: id, ...attributes } = value;
	return {
		id,
		attributes
	};
}

function transformIntoDatabaseSession(value: SessionDoc): DatabaseSession {
	delete value.__v;
	const { _id: id, user_id: userId, expires_at: expiresAt, ...attributes } = value;
	return {
		id,
		userId,
		expiresAt,
		attributes
	};
}
