import express from "express";
import bodyParser from "body-parser";

import { auth } from "./lucia.js";
import { renderSignup, signupAction } from "./pages/signup.js";
import { loginAction, renderLogin } from "./pages/login.js";
import { renderIndex } from "./pages/index.js";
import { logoutAction } from "./pages/logout.js";

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", async (req, res) => {
	const authRequest = auth.handleRequest(req, res);
	const session = await authRequest.validate();
	console.log(session);
	if (!session) {
		// redirect to login page
		return res.status(302).setHeader("Location", "/login").end();
	}
	const html = renderIndex({
		userId: session.user.userId,
		username: session.user.username
	});
	res.setHeader("Content-Type", "text/html; charset=utf-8");
	res.send(html);
});

app.get("/login", async (req, res) => {
	const authRequest = auth.handleRequest(req, res);
	const session = await authRequest.validate();
	if (session) {
		// redirect to profile page
		return res.status(302).setHeader("Location", "/").end();
	}
	const html = renderLogin({});
	res.setHeader("Content-Type", "text/html; charset=utf-8");
	res.send(html);
});

app.post("/login", loginAction);

app.get("/signup", async (req, res) => {
	const authRequest = auth.handleRequest(req, res);
	const session = await authRequest.validate();
	if (session) {
		// redirect to profile page
		return res.status(302).setHeader("Location", "/").end();
	}
	const html = renderSignup({});
	res.setHeader("Content-Type", "text/html; charset=utf-8");
	res.send(html);
});

app.post("/signup", signupAction);

app.post("/logout", logoutAction);

app.listen("3000", () => {
	console.log("App running in port 3000");
});
