import { app, BrowserWindow, ipcMain, shell, net } from "electron";
import path from "path";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
	app.quit();
}

if (process.defaultApp) {
	if (process.argv.length >= 2) {
		app.setAsDefaultProtocolClient("electron-app", process.execPath, [
			path.resolve(process.argv[1])
		]);
	}
} else {
	app.setAsDefaultProtocolClient("electron-app");
}

let mainWindow: BrowserWindow;

const main = () => {
	app.on("ready", createWindow);

	// Quit when all windows are closed, except on macOS. There, it's common
	// for applications and their menu bar to stay active until the user quits
	// explicitly with Cmd + Q.
	app.on("window-all-closed", () => {
		if (process.platform !== "darwin") {
			app.quit();
		}
	});

	app.on("activate", () => {
		// On OS X it's common to re-create a window in the app when the
		// dock icon is clicked and there are no other windows open.
		if (BrowserWindow.getAllWindows().length === 0) {
			createWindow();
		}
	});

	app.on("second-instance", (_, commandLine) => {
		// Someone tried to run a second instance, we should focus our window.
		if (mainWindow) {
			if (mainWindow.isMinimized()) mainWindow.restore();
			mainWindow.focus();
		}
		const url = commandLine.at(-1);
		handleDeepLinkCallback(url);
	});

	app.on("open-url", (_, url) => {
		if (BrowserWindow.getAllWindows().length === 0) {
			createWindow();
		}
		handleDeepLinkCallback(url);
	});

	ipcMain.handle("auth:signInWithGithub", () => {
		shell.openExternal("http://localhost:3000/login/github");
	});

	ipcMain.handle("auth:getUser", async (e, sessionToken: string) => {
		const response = await net.fetch("http://localhost:3000/user", {
			headers: {
				Authorization: `Bearer ${sessionToken}`
			}
		});
		if (!response.ok) {
			return null;
		}
		return await response.json();
	});

	ipcMain.handle("auth:signOut", async (e, sessionToken: string) => {
		await net.fetch("http://localhost:3000/logout", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${sessionToken}`
			}
		});
	});
};

const createWindow = () => {
	// Create the browser window.
	mainWindow = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {
			preload: path.join(__dirname, "preload.js")
		}
	});

	// and load the index.html of the app.
	if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
		mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
	} else {
		mainWindow.loadFile(
			path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
		);
	}
};

const handleDeepLinkCallback = (url: string) => {
	if (!url.startsWith("electron-app://login?")) return;
	const params = new URLSearchParams(url.replace("electron-app://login?", ""));
	const sessionToken = params.get("session_token");
	if (!sessionToken) return;
	mainWindow.webContents.send("auth-state-update", sessionToken);
};

if (app.requestSingleInstanceLock()) {
	main();
} else {
	app.quit();
}
