import { post, get } from "./request.js";
import type { Auth, GlobalUserAttributes, User } from "lucia-auth";
import { generateState, OAuthConfig, OAuthProvider } from "./index.js";

interface Configs extends OAuthConfig {
	redirectUri: string;
	forceVerify?: boolean;
}

class Twitch<A extends Auth> implements OAuthProvider {
	constructor(auth: A, configs: Configs) {
		this.auth = auth;
		this.clientId = configs.clientId;
		this.clientSecret = configs.clientSecret;
		this.scope = configs.scope || ["user:read:email"];
		this.redirectUri = configs.redirectUri;
		this.forceVerify = configs.forceVerify || false;
	}
	private auth: A;
	private clientId: string;
	private clientSecret: string;
	private scope: string[];
	private redirectUri: string;
	private forceVerify: boolean;

	public getAuthorizationUrl = (
		state?: string | null
	): [url: string, state: string | undefined] => {
		const s = state ?? (typeof state === "undefined" ? generateState() : undefined);
		const url = `https://id.twitch.tv/oauth2/authorize?${new URLSearchParams({
			client_id: this.clientId,
			redirect_uri: this.redirectUri,
			scope: this.scope.join(" "),
			response_type: "code",
			force_verify: this.forceVerify.toString(),
			...(s && { state: s })
		}).toString()}`;

		return [url, s];
	};

	public validateCallback = async (code: string) => {
		const { access_token: accessToken } = (await post(
			`https://id.twitch.tv/oauth2/token?${new URLSearchParams({
				client_id: this.clientId,
				client_secret: this.clientSecret,
				code,
				grant_type: "authorization_code",
				redirect_uri: this.redirectUri
			}).toString()}`
		)) as {
			access_token: string;
		};

		const twitchUser = (
			await get("https://api.twitch.tv/helix/users", {
				bearerToken: accessToken,
				clientId: this.clientId
			})
		).data[0] as TwitchUser;

		const twitchUserId = String(twitchUser.id);
		let existingUser: User | null = null;
		try {
			existingUser = await this.auth.getUserByProviderId("twitch", twitchUserId);
		} catch {
			// existingUser is null
		}
		return {
			createUser: async (userAttributes: GlobalUserAttributes = {}) => {
				return await this.auth.createUser("twitch", twitchUserId, {
					attributes: userAttributes
				});
			},
			existingUser,
			providerUser: twitchUser,
			accessToken
		};
	};
}

const twitch = <A extends Auth>(auth: A, configs: Configs) => {
	return new Twitch(auth, configs);
};

export default twitch;

interface TwitchUser {
	id: string;
	login: string;
	display_name: string;
	type: "" | "admin" | "staff" | "global_mod";
	broadcaster_type: "" | "affiliate" | "partner";
	description: string;
	profile_image_url: string;
	offline_image_url: string;
	view_count: number;
	email: string;
	created_at: string;
}
