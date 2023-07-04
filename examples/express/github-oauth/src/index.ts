import express from "express";

import loginRouter from "./routes/login/index.js";
import indexRouter from "./routes/index.js";
import logoutRouter from "./routes/logout.js";

const app = express();

app.use(indexRouter, loginRouter, logoutRouter);

app.listen("3000", () => {
	console.log("App running in port 3000");
});
