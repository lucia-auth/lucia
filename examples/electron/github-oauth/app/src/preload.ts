import "./index.css";

import { ipcRenderer } from "electron";

window.addEventListener("DOMContentLoaded", async () => {
	const loginButton = document.getElementById("login-button");
	const profileBody = document.getElementById("profile");
	const logoutButton = document.getElementById("logout-button");
	if (!loginButton || !profileBody || !logoutButton) return;

	const renderUserProfile = (user: User | null) => {
		profileBody.textContent = user ? JSON.stringify(user, null, 2) : "(none)";
	};

	loginButton.addEventListener("click", async () => {
		await ipcRenderer.invoke("auth:signInWithGithub");
	});

	logoutButton.addEventListener("click", async () => {
		const sessionToken = localStorage.getItem("session_token");
		if (!sessionToken) return;
		await ipcRenderer.invoke("auth:signOut", sessionToken);
		renderUserProfile(null);
		localStorage.removeItem("session_token");
	});

	ipcRenderer.on(
		"auth-state-update",
		async (e, sessionToken: string | null) => {
			if (!sessionToken) {
				renderUserProfile(null);
				return;
			}
			localStorage.setItem("session_token", sessionToken);
			const user = await getUser(sessionToken);
			console.log(user);
			if (!user) {
				localStorage.removeItem("session_token");
			}
			renderUserProfile(user);
		}
	);

	const sessionToken = localStorage.getItem("session_token");
	if (sessionToken) {
		const user = await getUser(sessionToken);
		renderUserProfile(user);
	}
});

const getUser = async (sessionToken: string): Promise<User | null> => {
	return await ipcRenderer.invoke("auth:getUser", sessionToken);
};

type User = {
	userId: string;
	username: string;
};
