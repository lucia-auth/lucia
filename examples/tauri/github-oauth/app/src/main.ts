import { invoke } from "@tauri-apps/api/tauri";
import { getClient, ResponseType } from "@tauri-apps/api/http";

window.addEventListener("DOMContentLoaded", async () => {
	const loginButton = document.getElementById("login-button");
	const profileBody = document.getElementById("profile");
	const logoutButton = document.getElementById("logout-button");
	if (!loginButton || !profileBody || !logoutButton) return;

	const renderUserProfile = (user: User | null) => {
		profileBody.textContent = user ? JSON.stringify(user, null, 2) : "(none)";
	};

	loginButton.addEventListener("click", async () => {
		try {
			const sessionToken = await invoke<string>("authenticate");
			localStorage.setItem("session_token", sessionToken);
			const user = await getUser(sessionToken);
			renderUserProfile(user);
		} catch (e) {
			console.log(e);
		}
	});
	logoutButton.addEventListener("click", async () => {
		const sessionToken = localStorage.getItem("session_token");
		if (!sessionToken) return;
		const client = await getClient();
		const response = await client.request({
			url: "http://localhost:3000/logout",
			method: "POST",
			headers: {
				Authorization: `Bearer ${sessionToken}`
			}
		});
		if (!response.ok) return;
		localStorage.removeItem("session_token");
		renderUserProfile(null);
	});

	const sessionToken = localStorage.getItem("session_token");
	if (sessionToken) {
		const user = await getUser(sessionToken);
		if (!user) {
			localStorage.removeItem("session_token");
		}
		renderUserProfile(user);
	}
});

const getUser = async (sessionToken: string): Promise<User | null> => {
	const client = await getClient();
	const response = await client.get<User>("http://localhost:3000/user", {
		headers: {
			Authorization: `Bearer ${sessionToken}`
		},
		responseType: ResponseType.JSON
	});
	if (!response.ok) {
		return null;
	}
	return response.data;
};

type User = {
	userId: string;
	username: string;
};
