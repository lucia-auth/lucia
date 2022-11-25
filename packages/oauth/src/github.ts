import { post, get } from "./request.js";
import type { Auth, GlobalUserAttributes, User } from "lucia-auth";
import {
	generateState,
	GetAuthorizationUrlReturnType,
	OAuthConfig,
	OAuthProvider
} from "./index.js";

interface Configs extends OAuthConfig {}

class Github<A extends Auth> implements OAuthProvider {
	constructor(auth: A, configs: Configs) {
		this.auth = auth;
		this.clientId = configs.clientId;
		this.clientSecret = configs.clientSecret;
		this.scope = configs.scope || [];
	}
	private auth: A;
	private clientId: string;
	private clientSecret: string;
	private scope: string[];

	public getAuthorizationUrl = <State extends string | null | undefined = undefined>(
		state?: State
	): GetAuthorizationUrlReturnType<State> => {
		const s = state ?? (typeof state === "undefined" ? generateState() : undefined);
		const url = `https://github.com/login/oauth/authorize?${new URLSearchParams({
			client_id: this.clientId,
			scope: this.scope.join(" "),
			...(s && { state: s })
		}).toString()}`;
		if (state === null) return [url] as const as GetAuthorizationUrlReturnType<State>;
		return [url, s] as const as GetAuthorizationUrlReturnType<State>;
	};

	public validateCallback = async (code: string) => {
		const { access_token: accessToken } = (await post(
			`https://github.com/login/oauth/access_token?${new URLSearchParams({
				client_id: this.clientId,
				client_secret: this.clientSecret,
				code
			}).toString()}`
		)) as {
			access_token: string;
		};
		const githubUser = (await get("https://api.github.com/user", {
			bearerToken: accessToken
		})) as GithubUser;
		const githubUserId = String(githubUser.id);
		let existingUser: User | null = null;
		try {
			existingUser = await this.auth.getUserByProviderId("github", githubUserId);
		} catch {
			// existingUser is null
		}
		return {
			createUser: async (userAttributes: GlobalUserAttributes = {}) => {
				return await this.auth.createUser("github", githubUserId, {
					attributes: userAttributes
				});
			},
			existingUser,
			providerUser: githubUser,
			accessToken
		};
	};
}

const github = <A extends Auth>(auth: A, configs: Configs) => {
	return new Github(auth, configs);
};

export default github;

interface GithubUser {
	login: string;
	id: number;
	node_id: string;
	avatar_url: string;
	gravatar_id: string;
	url: string;
	html_url: string;
	followers_url: string;
	following_url: string;
	gists_url: string;
	starred_url: string;
	subscriptions_url: string;
	organizations_url: string;
	repos_url: string;
	events_url: string;
	received_events_url: string;
	type: string;
	site_admin: boolean;
	name: string;
	company: string;
	blog: string;
	location: string;
	email: string;
	hireable: boolean;
	bio: string;
	twitter_username: string;
	public_repos: number;
	public_gists: number;
	followers: number;
	following: number;
	created_at: string;
	updated_at: string;
	private_gists?: number;
	total_private_repos?: number;
	owned_private_repos?: number;
	disk_usage?: number;
	collaborators?: number;
	two_factor_authentication?: boolean;
	plan?: {
		name: string;
		space: number;
		private_repos: number;
		collaborators: number;
	};
}
