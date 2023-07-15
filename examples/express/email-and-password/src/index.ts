import express from "express";

import signupRouter from "./routes/signup.js";
import loginRouter from "./routes/login.js";
import indexRouter from "./routes/index.js";
import logoutRouter from "./routes/logout.js";
import emailVerificationRouter from "./routes/email-verification.js";
import passwordResetRouter from "./routes/password-reset/index.js";

const app = express();

app.use(express.urlencoded());

app.use(
	signupRouter,
	loginRouter,
	indexRouter,
	logoutRouter,
	emailVerificationRouter,
	passwordResetRouter
);

app.listen("3000", () => {
	console.log("App running in port 3000");
});
