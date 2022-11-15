import lucia from "lucia-auth";
import supabase from "@lucia-auth/adapter-supabase";
import github from "@lucia-auth/oauth/github";
import google from "@lucia-auth/oauth/google";

export const auth = lucia({
	adapter: supabase(import.meta.env.SUPABASE_URL || "", import.meta.env.SUPABASE_SECRET || ""),
	env: "DEV",
	transformUserData: (userData) => {
		return {
			userId: userData.id,
			username: userData.username
		};
	}
});

export type Auth = typeof auth;

export const githubAuth = github(auth, {
	clientId: import.meta.env.GITHUB_CLIENT_ID || "",
	clientSecret: import.meta.env.GITHUB_CLIENT_SECRET || ""
});

export const googleAuth = google(auth, {
	clientId: import.meta.env.GOOGLE_CLIENT_ID || "",
	clientSecret: import.meta.env.GOOGLE_CLIENT_SECRET || "",
	redirectUri: "http://localhost:3000/api/google"
});
