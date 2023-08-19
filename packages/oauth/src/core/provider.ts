import type { LuciaUser, LuciaDatabaseUserAttributes } from "../lucia.js";
import type { Auth, LuciaError, Key } from "lucia";

export class ProviderUserAuth<_Auth extends Auth = Auth> {
	private auth: _Auth;
	private providerId: string;
	private providerUserId: string;

	constructor(auth: _Auth, providerId: string, providerUserId: string) {
		this.auth = auth;
		this.providerId = providerId;
		this.providerUserId = providerUserId;
	}

	public getExistingUser = async (): Promise<LuciaUser<_Auth> | null> => {
		try {
			const key = await this.auth.useKey(
				this.providerId,
				this.providerUserId,
				null
			);
			const user = await this.auth.getUser(key.userId);
			return user as LuciaUser<_Auth>;
		} catch (e) {
			const error = e as Partial<LuciaError>;
			if (error?.message !== "AUTH_INVALID_KEY_ID") throw e;
			return null;
		}
	};

	public createKey = async (userId: string): Promise<Key> => {
		return await this.auth.createKey({
			userId,
			providerId: this.providerId,
			providerUserId: this.providerUserId,
			password: null
		});
	};

	public createUser = async (options: {
		userId?: string;
		attributes: LuciaDatabaseUserAttributes<_Auth>;
	}): Promise<LuciaUser<_Auth>> => {
		const user = await this.auth.createUser({
			key: {
				providerId: this.providerId,
				providerUserId: this.providerUserId,
				password: null
			},
			...options
		});
		return user as LuciaUser<_Auth>;
	};
}

export const providerUserAuth = <_Auth extends Auth = Auth>(
	auth: _Auth,
	providerId: string,
	providerUserId: string
): ProviderUserAuth<_Auth> => {
	return new ProviderUserAuth(auth, providerId, providerUserId);
};
