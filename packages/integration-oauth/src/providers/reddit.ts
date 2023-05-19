import { createUrl, handleRequest, authorizationHeaders } from "../request.js";
import { scope, generateState, connectAuth } from "../core.js";

import type { Auth } from "lucia-auth";
import type { OAuthConfig, OAuthProvider } from "../core.js";

type Config = OAuthConfig & {
	redirectUri: string;
};

const PROVIDER_ID = "reddit";

export const reddit = <_Auth extends Auth>(auth: _Auth, config: Config) => {
	const getTokens = async (code: string) => {
		const requestUrl = createUrl("https://www.reddit.com/api/v1/access_token", {
			grant_type: "authorization_code",
			redirect_uri: config.redirectUri,
			code
		});
		const request = new Request(requestUrl, {
			method: "POST",
			headers: authorizationHeaders(
				"basic",
				encodeBase64(config.clientId + ":" + config.clientSecret)
			)
		});
		const tokens = await handleRequest<{
			access_token: string;
		}>(request);

		return {
			accessToken: tokens.access_token
		};
	};

	const getProviderUser = async (accessToken: string) => {
		const request = new Request("https://oauth.reddit.com/api/v1/me", {
			headers: authorizationHeaders("bearer", accessToken)
		});
		const redditUser = await handleRequest<RedditUser>(request);

		return redditUser;
	};

	return {
		getAuthorizationUrl: async (redirectUri?: string) => {
			const state = generateState();
			const url = createUrl("https://www.reddit.com/api/v1/authorize", {
				client_id: config.clientId,
				response_type: "code",
				redirect_uri: redirectUri ?? config.redirectUri,
				duration: "permanent",
				scope: scope([], config.scope),
				state
			});
			return [url, state] as const;
		},
		validateCallback: async (code: string) => {
			const tokens = await getTokens(code);
			const providerUser = await getProviderUser(tokens.accessToken);
			const providerUserId = providerUser.id;
			const providerAuth = await connectAuth(auth, PROVIDER_ID, providerUserId);
			return {
				...providerAuth,
				providerUser,
				tokens
			};
		}
	} as const satisfies OAuthProvider<_Auth>;
};

const encodeBase64 = (s: string) => {
	// ORDER IS IMPORTANT!!
	// Buffer API EXISTS IN DENO!!
	if (typeof window !== "undefined" && "Deno" in window) {
		// deno
		return btoa(s);
	}
	if (typeof Buffer === "function") {
		// node
		return Buffer.from(s).toString("base64");
	}

	// standard API
	// IGNORE WARNING
	return btoa(s);
};

export type RedditUser = {
	is_employee: boolean;
	seen_layout_switch: boolean;
	has_visited_new_profile: boolean;
	pref_no_profanity: boolean;
	has_external_account: boolean;
	pref_geopopular: string;
	seen_redesign_modal: boolean;
	pref_show_trending: boolean;
	subreddit: {
		default_set: boolean;
		user_is_contributor: boolean;
		banner_img: string;
		restrict_posting: boolean;
		user_is_banned: boolean;
		free_form_reports: boolean;
		community_icon: string;
		show_media: boolean;
		icon_color: string;
		user_is_muted: boolean;
		display_name: string;
		header_img: string;
		title: string;
		coins: number;
		previous_names: string[];
		over_18: boolean;
		icon_size: [number, number];
		primary_color: string;
		icon_img: string;
		description: string;
		allowed_media_in_comments: any[];
		submit_link_label: string;
		header_size: any;
		restrict_commenting: boolean;
		subscribers: number;
		submit_text_label: string;
		is_default_icon: boolean;
		link_flair_position: string;
		display_name_prefixed: string;
		key_color: string;
		name: string;
		is_default_banner: boolean;
		url: string;
		quarantine: boolean;
		banner_size: [number, number];
		user_is_moderator: boolean;
		accept_followers: boolean;
		public_description: string;
		link_flair_enabled: boolean;
		disable_contributor_requests: boolean;
		subreddit_type: string;
		user_is_subscriber: boolean;
	};
	pref_show_presence: boolean;
	snoovatar_img: string;
	snoovatar_size: [number, number];
	gold_expiration: any;
	has_gold_subscription: boolean;
	is_sponsor: boolean;
	num_friends: number;
	features: {
		mod_service_mute_writes: boolean;
		promoted_trend_blanks: boolean;
		show_amp_link: boolean;
		chat: boolean;
		is_email_permission_required: true;
		mod_awards: boolean;
		expensive_coins_package: boolean;
		mweb_xpromo_revamp_v2: {
			owner: string;
			variant: string;
			experiment_id: number;
		};
		awards_on_streams: boolean;
		mweb_xpromo_modal_listing_click_daily_dismissible_ios: true;
		chat_subreddit: boolean;
		cookie_consent_banner: boolean;
		modlog_copyright_removal: boolean;
		do_not_track: boolean;
		images_in_comments: boolean;
		mod_service_mute_reads: boolean;
		chat_user_settings: boolean;
		use_pref_account_deployment: boolean;
		mweb_xpromo_interstitial_comments_ios: boolean;
		mweb_xpromo_modal_listing_click_daily_dismissible_android: boolean;
		premium_subscriptions_table: boolean;
		mweb_xpromo_interstitial_comments_android: true;
		crowd_control_for_post: boolean;
		mweb_nsfw_xpromo: { owner: string; variant: string; experiment_id: number };
		noreferrer_to_noopener: boolean;
		chat_group_rollout: boolean;
		resized_styles_images: boolean;
		spez_modal: boolean;
		mweb_sharing_clipboard: {
			owner: string;
			variant: string;
			experiment_id: number;
		};
	};
	can_edit_name: boolean;
	verified: boolean;
	pref_autoplay: boolean;
	coins: number;
	has_paypal_subscription: boolean;
	has_subscribed_to_premium: boolean;
	id: string;
	has_stripe_subscription: boolean;
	oauth_client_id: string;
	can_create_subreddit: boolean;
	over_18: boolean;
	is_gold: boolean;
	is_mod: boolean;
	awarder_karma: number;
	suspension_expiration_utc: any;
	has_verified_email: boolean;
	is_suspended: boolean;
	pref_video_autoplay: boolean;
	has_android_subscription: boolean;
	in_redesign_beta: boolean;
	icon_img: string;
	pref_nightmode: boolean;
	awardee_karma: number;
	hide_from_robots: boolean;
	password_set: boolean;
	link_karma: number;
	force_password_reset: boolean;
	total_karma: number;
	seen_give_award_tooltip: boolean;
	inbox_count: number;
	seen_premium_adblock_modal: boolean;
	pref_top_karma_subreddits: boolean;
	pref_show_snoovatar: boolean;
	name: string;
	pref_clickgadget: number;
	created: number;
	gold_creddits: number;
	created_utc: number;
	has_ios_subscription: boolean;
	pref_show_twitter: boolean;
	in_beta: boolean;
	comment_karma: number;
	accept_followers: boolean;
	has_subscribed: boolean;
	linked_identities: any[];
	seen_subreddit_chat_ftux: boolean;
};
