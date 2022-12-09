import { post, get } from "./request.js";
import type { Auth, GlobalUserAttributes, User } from "lucia-auth";
import {
	generateState,
	GetAuthorizationUrlReturnType,
	OAuthConfig,
	OAuthProvider
} from "./index.js";

interface Configs extends OAuthConfig {
	redirectUri: string;
	allMemberships?: boolean;
}

class Patreon<A extends Auth> implements OAuthProvider {
	constructor(auth: A, configs: Configs) {
		this.auth = auth;
		this.clientId = configs.clientId;
		this.clientSecret = configs.clientSecret;
		this.redirectUri = configs.redirectUri;
		this.scope = [
			"identity",
			"identity[email]",
			...(configs.scope || []),
			...(configs.allMemberships ? ["identity.memberships"] : [])
		];
	}
	private auth: A;
	private clientId: string;
	private clientSecret: string;
	private scope: string[];
	private redirectUri: string;

	public getAuthorizationUrl = <State extends string | null | undefined = undefined>(
		state?: State
	): GetAuthorizationUrlReturnType<State> => {
		const s = state ?? (typeof state === "undefined" ? generateState() : undefined);
		const url = `https://www.patreon.com/oauth2/authorize?${new URLSearchParams({
			client_id: this.clientId,
			redirect_uri: this.redirectUri,
			scope: this.scope.join(" "),
			response_type: "code",
			...(s && { state: s })
		}).toString()}`;
		console.log(this.scope);
		if (state === null) return [url] as const as GetAuthorizationUrlReturnType<State>;
		return [url, s] as const as GetAuthorizationUrlReturnType<State>;
	};

	public validateCallback = async (code: string) => {
		const {
			access_token: accessToken,
			refresh_token: refreshToken,
			expires_in: expiresIn
		} = (await post(
			`https://www.patreon.com/api/oauth2/token?${new URLSearchParams({
				client_id: this.clientId,
				client_secret: this.clientSecret,
				code,
				grant_type: "authorization_code",
				redirect_uri: this.redirectUri
			}).toString()}`
		)) as {
			access_token: string;
			refresh_token?: string;
			expires_in: number;
		};
		const patreonUserRaw = (await get(
			`https://www.patreon.com/api/oauth2/v2/identity?${new URLSearchParams({
				"fields[user]":
					"about,email,first_name,full_name,hide_pledges,image_url,is_email_verified,last_name,url",
				"fields[tier]": "amount_cents,title",
				"fields[campaign]": "vanity",
				include: "memberships.currently_entitled_tiers,memberships.campaign"
			}).toString()}`,
			{
				bearerToken: accessToken
			}
		)) as PatreonUserRaw;

		const remappedRelationships = remapRelationships(patreonUserRaw);

		const patreonUser: PatreonUser = {
			...patreonUserRaw.data,
			relationships: { memberships: remappedRelationships }
		};

		const patreonUserId = String(patreonUser.id);

		let existingUser: User | null = null;
		try {
			existingUser = await this.auth.getUserByProviderId("patreon", patreonUserId);
		} catch {
			// existingUser is null
		}
		return {
			createUser: async (userAttributes: GlobalUserAttributes = {}) => {
				return await this.auth.createUser("patreon", patreonUserId, {
					attributes: userAttributes
				});
			},
			existingUser,
			providerUser: patreonUser,
			accessToken,
			refreshToken,
			expiresIn
		};
	};
}

const patreon = <A extends Auth>(auth: A, configs: Configs) => {
	return new Patreon(auth, configs);
};

export default patreon;

function remapRelationships(patreonUserRaw: PatreonUserRaw) {
	return patreonUserRaw.data.relationships.memberships.data
		.map((element) => {
			return patreonUserRaw.included.find(
				(include) => include.type === element.type && include.id === element.id
			) as PatreonMembershipRaw;
		})
		.map((element) => {
			const campaign = patreonUserRaw.included.find(
				(include) =>
					include.type === "campaign" && include.id === element.relationships.campaign?.data.id
			) as PatreonCampaign;
			const currently_entitled_tiers = element.relationships.currently_entitled_tiers.data.map(
				(tier) => {
					return patreonUserRaw.included.find(
						(include) => include.type == tier.type && include.id == tier.id
					) as PatreonTier;
				}
			);

			return {
				id: element.id,
				type: element.type,
				relationships: {
					campaign: campaign,
					currently_entitled_tiers: currently_entitled_tiers
				}
			} as PatreonMembership;
		});
}

interface PatreonUserRaw {
	data: {
		type: "user";
		attributes: {
			about: string | null;
			created: string;
			email: string;
			first_name: string | null;
			full_name: string;
			hide_pledges: boolean | null;
			image_url: string;
			is_email_verified: boolean;
			last_name: string | null;
			url: string;
		};
		relationships: {
			memberships: {
				data: [
					{
						id: "string";
						type: "member";
					}
				];
			};
		};
		id: string;
	};
	included: [PatreonCampaign | PatreonMembershipRaw | PatreonTier];
}

interface PatreonMembershipRaw {
	type: "member";
	id: string;
	relationships: {
		campaign?: {
			data: {
				id: string;
				type: "campaign";
			};
		};
		currently_entitled_tiers: {
			data: [
				{
					id: string;
					type: "tier";
				}
			];
		};
	};
}
interface PatreonUser {
	type: "user";
	attributes: {
		about: string | null;
		created: string;
		email: string;
		first_name: string | null;
		full_name: string;
		hide_pledges: boolean | null;
		image_url: string;
		is_email_verified: boolean;
		last_name: string | null;
		url: string;
	};
	id: string;
	relationships: {
		memberships: PatreonMembership[];
	};
}

interface PatreonMembership {
	type: "member";
	id: string;
	relationships: {
		campaign: PatreonCampaign;
		currently_entitled_tiers: PatreonTier[];
	};
}

interface PatreonCampaign {
	attributes: {
		vanity: string | null;
	};
	id: string;
	type: "campaign";
}

interface PatreonTier {
	attributes: {
		amount_cents: number;
		title: string;
	};
	id: string;
	type: "tier";
}
