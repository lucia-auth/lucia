import { StatusBar } from "expo-status-bar";
import { Button, StyleSheet, Text, View } from "react-native";
import * as Browser from "expo-web-browser";
import * as Linking from "expo-linking";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";

export default function App() {
	const [currentUser, setCurrentUser] = useState<User | null>(null);

	const signIn = async () => {
		const result = await Browser.openAuthSessionAsync(
			"http://localhost:3000/login/github",
			"exp://192.168.2.100:8081/login"
		);
		if (result.type !== "success") return;
		const url = Linking.parse(result.url);
		const sessionToken = url.queryParams?.session_token?.toString() ?? null;
		if (!sessionToken) return;
		const user = await getUser(sessionToken);
		await SecureStore.setItemAsync("session_token", sessionToken);
		setCurrentUser(user);
	};

	const signOut = async () => {
		const sessionToken = await SecureStore.getItemAsync("session_token");
		const response = await fetch("http://localhost:3000/logout", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${sessionToken}`
			}
		});
		if (!response.ok) return;
		await SecureStore.deleteItemAsync("session_token");
		setCurrentUser(null);
	};

	useEffect(() => {
		const setup = async () => {
			const sessionToken = await SecureStore.getItemAsync("session_token");
			let user: User | null = null;
			if (sessionToken) {
				user = await getUser(sessionToken);
				if (!user) {
					await SecureStore.deleteItemAsync("session_token");
				}
			} else {
				await SecureStore.deleteItemAsync("session_token");
			}
			setCurrentUser(user);
		};
		setup();
	}, []);

	return (
		<View style={styles.container}>
			<Text style={{ fontSize: 24, fontWeight: "600" }}>
				GitHub OAuth with Lucia
			</Text>
			<Text style={{ fontFamily: "Courier New", fontSize: 16 }}>
				{currentUser ? JSON.stringify(currentUser, null, 2) : "(none)"}
			</Text>
			<Button title="Sign in with Github" onPress={signIn} />
			<Button title="Sign out" onPress={signOut} />
			<StatusBar style="auto" />
		</View>
	);
}

const getUser = async (sessionToken: string): Promise<User | null> => {
	const response = await fetch("http://localhost:3000/user", {
		headers: {
			Authorization: `Bearer ${sessionToken}`
		}
	});
	if (!response.ok) return null;
	return await response.json();
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff",
		alignItems: "center",
		justifyContent: "center"
	}
});

type User = {
	userId: string;
	username: string;
};
