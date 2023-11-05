import type {
	Adapter,
	DatabaseSession,
	DatabaseSessionAttributes,
	DatabaseUser,
	DatabaseUserAttributes
} from "lucia";

export class PrismaAdapter<_PrismaClient extends PrismaClient>
	implements Adapter
{
	public s: _PrismaClient = {} as any;
	private userModel: PrismaModel<UserSchema>;
	private sessionModel: PrismaModel<SessionSchema>;
	private userModelName: string;

	constructor(
		client: _PrismaClient,
		modelNames: {
			user: ModelName<_PrismaClient>;
			session: ModelName<_PrismaClient>;
		}
	) {
		this.userModelName = modelNames.user;
		const userModelKey =
			modelNames.user[0].toLowerCase() + modelNames.user.slice(1);
		const sessionModelKey =
			modelNames.session[0].toLowerCase() + modelNames.session.slice(1);
		this.userModel = client[userModelKey];
		this.sessionModel = client[sessionModelKey];
	}

	public async deleteSession(sessionId: string): Promise<void> {
		try {
			await this.sessionModel.delete({
				where: {
					id: sessionId
				}
			});
		} catch {
			// ignore if session id is invalid
		}
	}

	public async deleteUserSessions(userId: string): Promise<void> {
		await this.sessionModel.deleteMany({
			where: {
				userId
			}
		});
	}

	public async getSessionAndUser(
		sessionId: string
	): Promise<[session: DatabaseSession | null, user: DatabaseUser | null]> {
		const userModelKey =
			this.userModelName[0].toLowerCase() + this.userModelName.slice(1);
		const result = await this.sessionModel.findUnique<{
			// this is a lie to make TS shut up
			user: UserSchema;
		}>({
			where: {
				id: sessionId
			},
			include: {
				[userModelKey]: true
			}
		});
		if (!result) return [null, null];
		const userResult: UserSchema = result[userModelKey as "user"];
		delete result[userModelKey as keyof typeof result];
		return [
			transformIntoDatabaseSession(result),
			transformIntoDatabaseUser(userResult)
		];
	}

	public async getUserSessions(userId: string): Promise<DatabaseSession[]> {
		const result = await this.sessionModel.findMany({
			where: {
				userId
			}
		});
		return result.map(transformIntoDatabaseSession);
	}

	public async setSession(value: DatabaseSession): Promise<void> {
		await this.sessionModel.create({
			data: {
				id: value.sessionId,
				userId: value.userId,
				expiresAt: value.expiresAt,
				...value.attributes
			}
		});
	}

	public async updateSession(
		sessionId: string,
		value: Partial<DatabaseSession>
	): Promise<void> {
		await this.sessionModel.update({
			where: {
				id: sessionId
			},
			data: {
				id: value.sessionId,
				userId: value.userId,
				expiresAt: value.expiresAt,
				...value.attributes
			}
		});
	}
}

function transformIntoDatabaseSession(raw: SessionSchema): DatabaseSession {
	const { id: sessionId, userId, expiresAt, ...attributes } = raw;
	return {
		sessionId,
		userId,
		expiresAt,
		attributes
	};
}

function transformIntoDatabaseUser(raw: UserSchema): DatabaseUser {
	const { id: userId, ...attributes } = raw;
	return {
		userId,
		attributes
	};
}

interface PrismaClient {
	[K: string]: any;
	$connect: any;
	$transaction: any;
}

type ModelName<_PrismaClient extends PrismaClient> = Capitalize<
	Extract<Exclude<keyof _PrismaClient, `$${string}`>, string>
>;

interface UserSchema extends DatabaseUserAttributes {
	id: string;
}

// TODO:
// `id` or `userId`: Prisma uses `id`
interface SessionSchema extends DatabaseSessionAttributes {
	id: string;
	userId: string;
	expiresAt: Date;
}

export type PrismaModel<_Schema> = {
	findUnique: <_Included = {}>(options: {
		where: Partial<_Schema>;
		include?: Record<string, boolean>;
	}) => Promise<null | (_Schema & _Included)>;
	findMany: (options?: { where: Partial<_Schema> }) => Promise<_Schema[]>;
	create: (options: { data: _Schema }) => Promise<_Schema>;
	delete: (options: { where: Partial<_Schema> }) => Promise<void>;
	deleteMany: (options?: { where: Partial<_Schema> }) => Promise<void>;
	update: (options: {
		data: Partial<_Schema>;
		where: Partial<_Schema>;
	}) => Promise<_Schema>;
};
