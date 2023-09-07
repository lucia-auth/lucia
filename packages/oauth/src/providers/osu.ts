import {
	OAuth2ProviderAuth,
	createOAuth2AuthorizationUrl,
	validateOAuth2AuthorizationCode
} from "../core/oauth2.js";
import { ProviderUserAuth } from "../core/provider.js";
import { handleRequest, authorizationHeader } from "../utils/request.js";

import type { Auth } from "lucia";

type Config = {
	clientId: string;
	clientSecret: string;
	redirectUri: string;
	scope?: string[];
};

const PROVIDER_ID = "osu";

export const osu = <_Auth extends Auth = Auth>(
	auth: _Auth,
	config: Config
): OsuAuth<_Auth> => {
	return new OsuAuth(auth, config);
};

export class OsuAuth<_Auth extends Auth = Auth> extends OAuth2ProviderAuth<
	OsuUserAuth<_Auth>
> {
	private config: Config;

	constructor(auth: _Auth, config: Config) {
		super(auth);

		this.config = config;
	}

	public getAuthorizationUrl = async (): Promise<
		readonly [url: URL, state: string]
	> => {
		const scopeConfig = this.config.scope ?? [];
		return await createOAuth2AuthorizationUrl(
			"https://osu.ppy.sh/oauth/authorize",
			{
				clientId: this.config.clientId,
				scope: ["identify", ...scopeConfig],
				redirectUri: this.config.redirectUri
			}
		);
	};

	public validateCallback = async (
		code: string
	): Promise<OsuUserAuth<_Auth>> => {
		const osuTokens = await this.validateAuthorizationCode(code);
		const osuUser = await getOsuUser(osuTokens.accessToken);
		return new OsuUserAuth(this.auth, osuUser, osuTokens);
	};

	private validateAuthorizationCode = async (
		code: string
	): Promise<OsuTokens> => {
		const tokens = await validateOAuth2AuthorizationCode<{
			access_token: string;
			expires_in: number;
			refresh_token: string;
			token_type: string;
		}>(code, "https://osu.ppy.sh/oauth/token", {
			clientId: this.config.clientId,
			redirectUri: this.config.redirectUri,
			clientPassword: {
				clientSecret: this.config.clientSecret,
				authenticateWith: "client_secret"
			}
		});

		return {
			accessToken: tokens.access_token,
			refreshToken: tokens.refresh_token,
			accessTokenExpiresIn: tokens.expires_in
		};
	};
}

export class OsuUserAuth<
	_Auth extends Auth = Auth
> extends ProviderUserAuth<_Auth> {
	public osuTokens: OsuTokens;
	public osuUser: OsuUser;

	constructor(auth: _Auth, osuUser: OsuUser, osuTokens: OsuTokens) {
		super(auth, PROVIDER_ID, osuUser.id.toString());

		this.osuTokens = osuTokens;
		this.osuUser = osuUser;
	}
}

const getOsuUser = async (accessToken: string): Promise<OsuUser> => {
	const request = new Request("https://osu.ppy.sh/api/v2/me/osu", {
		headers: {
			Authorization: authorizationHeader("bearer", accessToken)
		}
	});
	const osuUser = await handleRequest<OsuUser>(request);
	return osuUser;
};

export type OsuTokens = {
	accessToken: string;
	refreshToken: string;
	accessTokenExpiresIn: number;
};

export type OsuUser = {
	avatar_url: string;
	country_code: string;
	default_group: string;
	id: number;
	is_active: boolean;
	is_bot: boolean;
	is_deleted: boolean;
	is_online: boolean;
	is_supporter: boolean;
	last_visit: string;
	pm_friends_only: boolean;
	profile_colour: string | null;
	username: string;
	country: {
		code: string;
		name: string;
	};
	cover: {
		custom_url: string | null;
		url: string;
		id: string | null;
	};
	discord: string | null;
	has_supported: boolean;
	interests: string | null;
	join_date: string;
	kudosu: {
		available: number;
		total: number;
	};
	location: string | null;
	max_blocks: number;
	max_friends: number;
	occupation: string | null;
	playmode: OsuGameMode;
	playstyle: ("mouse" | "keyboard" | "tablet" | "touch")[];
	post_count: number;
	profile_order: (
		| "me"
		| "recent_activity"
		| "beatmaps"
		| "historical"
		| "kudosu"
		| "top_ranks"
		| "medals"
	)[];
	title: string | null;
	title_url: string | null;
	twitter: string | null;
	website: string | null;
	is_restricted: boolean;
	account_history: {
		description: string | null;
		id: number;
		length: number;
		permanent: boolean;
		timestamp: string;
		type: "note" | "restriction" | "silence";
	}[];
	active_tournament_banner: {
		id: number;
		tournament_id: number;
		image: string;
	} | null;
	badges: {
		awarded_at: string;
		description: string;
		image_url: string;
		url: string;
	}[];
	beatmap_playcounts_count: number;
	favourite_beatmapset_count: number;
	follower_count: number;
	graveyard_beatmapset_count: number;
	groups: {
		colour: string | null;
		has_listing: boolean;
		has_playmodes: boolean;
		id: number;
		identifier: string;
		is_probationary: boolean;
		name: string;
		short_name: string;
		playmodes: OsuGameMode[] | null;
	}[];
	loved_beatmapset_count: number;
	mapping_follower_count: number;
	monthly_playcounts: {
		start_date: string;
		count: number;
	}[];
	page: {
		html: string;
		raw: string;
	};
	pending_beatmapset_count: number;
	previous_usernames: string[];
	rank_highest: {
		rank: number;
		updated_at: string;
	} | null;
	rank_history: {
		mode: OsuGameMode;
		data: number[];
	};
	ranked_beatmapset_count: number;
	replays_watched_counts: {
		start_date: string;
		count: number;
	}[];
	scores_best_count: number;
	scores_first_count: number;
	scores_recent_count: number;
	statistics: OsuUserStatistics;
	statistics_rulesets: Record<OsuGameMode, OsuUserStatistics | undefined>;
	support_level: number;
	user_achievements: {
		achieved_at: string;
		achievement_id: number;
	}[];
};

type OsuUserStatistics = {
	grade_counts: {
		a: number;
		s: number;
		sh: number;
		ss: number;
		ssh: number;
	};
	hit_accuracy: number;
	is_ranked: boolean;
	level: {
		current: number;
		progress: number;
	};
	maximum_combo: number;
	play_count: number;
	play_time: number;
	pp: number;
	global_rank: number;
	ranked_score: number;
	replays_watched_by_others: number;
	total_hits: number;
	total_score: number;
	country_rank: number;
};

type OsuGameMode = "fruits" | "mania" | "osu" | "taiko";
