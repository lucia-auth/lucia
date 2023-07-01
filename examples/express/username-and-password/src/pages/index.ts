import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const renderIndex = (params: { userId: string; username: string }) => {
	const userId = params.userId ?? "";
	const username = params.username ?? "";
	let html = fs
		.readFileSync(path.join(__dirname, "index.html"))
		.toString("utf-8");
	html = html
		.replaceAll("%%user_id%%", userId)
		.replaceAll("%%username%%", username);
	return html;
};
