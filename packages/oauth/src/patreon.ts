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
		this.scope = ["identity", "identity[email]", ...(configs.scope || []),...(configs.allMemberships ? ["identity.memberships"]:[])];
        this.allMemberships = configs.allMemberships ?? false
	}
	private auth: A;
	private clientId: string;
	private clientSecret: string;
	private scope: string[];
	private redirectUri: string;
    private allMemberships: boolean;

	public getAuthorizationUrl = <State extends string | null | undefined = undefined>(
		state?: State
	): GetAuthorizationUrlReturnType<State> => {
		const s = state ?? (typeof state === "undefined" ? generateState() : undefined);
		const url = `https://www.patreon.com/oauth2/authorize${new URLSearchParams({
			client_id: this.clientId,
			redirect_uri: this.redirectUri,
			scope: this.scope.join(" "),
			response_type: "code",
			...(s && { state: s })
		}).toString()}`;
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
		const patreonUser = (await get(`https://www.patreon.com/api/oauth2/v2/identity?${new URLSearchParams({
            "fields[user]": "about,email,first_name,full_name,hide_pledges,image_url,is_email_verified,last_name,url",
            "fields[tier]": "amount_cents,title",
            "fields[campaign]": "vanity",
            "include": "memberships.currently_entitled_tiers"+(this.allMemberships ? ",memberships.campaign" : "")
        }).toString()}`, {
			bearerToken: accessToken
		})) as PatreonUser;
		const patreonUserId = String(patreonUser.data.id);
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

interface PatreonUser {
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
        id: string;
    }
    included: [PatreonCampaign | PatreonMembership | PatreonTier]
}

export interface PatreonMembership {
    type: "member";
    id: string;
    relationships: {
        campaign?: {
            data: {
                id: string;
                type: "campaign";
            }
        }
        currently_entitled_tiers: {
            data: [
                {
                    id: string;
                    type: "tier";
                }
            ]
        }
    }   
}


export interface PatreonCampaign {
    attributes: {
        vanity: string | null;
    }
    id: string;
    type: "campaign";
}

export interface PatreonTier {
    attributes: {
        amount_cents: number;
        title: string;
    }
    id: string;
    type: "tier";
}